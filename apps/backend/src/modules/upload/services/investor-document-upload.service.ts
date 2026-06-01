import { Injectable, BadRequestException } from '@nestjs/common';
import { Express } from 'express';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { compress as compressPdf } from 'compress-pdf';
import JSZip from 'jszip';
import * as mime from 'mime-types';

type PdfPreset = 'screen' | 'ebook' | 'printer' | 'prepress';

@Injectable()
export class InvestorDocumentUploadService {
  private readonly uploadDir = 'uploads/investorDocuments';
  private readonly allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
  ];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  /** ---- Helpers: GS path & PDF preset from env ---- */

  private getGhostscriptPath(): string | undefined {
    // Prefer env
    const fromEnv = process.env.GS_BIN;
    if (fromEnv && fromEnv.trim().length > 0) return fromEnv.trim();

    // Auto-defaults per platform (best effort)
    if (process.platform === 'win32') {
      // Common install locations (adjust versions if needed)
      const candidates = [
        'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe',
        'C:\\Program Files\\gs\\gs10.05.0\\bin\\gswin64c.exe',
        'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
      ];
      for (const p of candidates) {
        try {
          if (fs.existsSync(p)) return p;
        } catch {}
      }
      return undefined;
    }
    // Linux/macOS: rely on PATH (binary name usually 'gs')
    // compress-pdf will call 'gs' if gsModule is not provided and PATH contains it.
    return undefined;
  }

  private getPdfPreset(): PdfPreset {
    const preset = (process.env.PDF_PRESET || 'ebook').toLowerCase();
    if (
      preset === 'screen' ||
      preset === 'ebook' ||
      preset === 'printer' ||
      preset === 'prepress'
    ) {
      return preset;
    }
    return 'ebook';
  }

  /** ---- Existing APIs ---- */

  /**
   * Upload investor document
   * Path structure: uploads/investorDocuments/{investorProfileId}/{documentReferenceNumber}
   */
  async uploadDocument(
    file: Express.Multer.File,
    investorProfileId: string,
    documentReferenceNumber: string,
  ): Promise<{ filePath: string; fileName: string; size: number }> {
    this.validateFile(file);

    const investorDir = path.join(this.uploadDir, investorProfileId);
    this.ensureDirectoryExists(investorDir);

    const extension = path.extname(file.originalname);
    const filename = `${documentReferenceNumber}${extension}`;
    const filepath = path.join(investorDir, filename);

    if (fs.existsSync(filepath)) {
      throw new BadRequestException(
        `File already exists for this document reference number`,
      );
    }

    fs.writeFileSync(filepath, file.buffer);

    console.log('✅ Investor Document Uploaded:', {
      path: filepath,
      size: file.size,
      referenceNumber: documentReferenceNumber,
      investorId: investorProfileId,
    });

    return {
      filePath: `${investorDir}/${filename}`,
      fileName: filename,
      size: file.size,
    };
  }

  /**
   * Compress an existing file in-place and return compression stats.
   * If compressed size is larger, it keeps the original (no degradation).
   */
  async compressExistingFile(
    finalPath: string,
    mimeType?: string,
  ): Promise<{
    filePath: string;
    originalSizeBytes: number;
    compressedSizeBytes: number;
    savedBytes: number;
    savedPercent: number;
    mimeType: string;
  }> {
    const absPath = path.resolve(finalPath);
    if (!fs.existsSync(absPath)) {
      throw new BadRequestException(`File not found at ${absPath}`);
    }

    const statBefore = await fsp.stat(absPath);
    const originalSizeBytes = statBefore.size;
    const ext = path.extname(absPath).toLowerCase();
    const detectedMime =
      mimeType || (mime.lookup(ext) as string) || 'application/octet-stream';

    // Only compress known types
    const compressible = new Set([
      'image/png',
      'image/jpeg',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]);

    if (!compressible.has(detectedMime)) {
      // Pass-through; return stats with same size
      return {
        filePath: this.toRelative(absPath),
        originalSizeBytes,
        compressedSizeBytes: originalSizeBytes,
        savedBytes: 0,
        savedPercent: 0,
        mimeType: detectedMime,
      };
    }

    // Temp output file
    const tmpOut = `${absPath}.tmp`;

    try {
      if (detectedMime === 'image/png') {
        await sharp(absPath)
          .png({
            palette: true,
            quality: 80,
            compressionLevel: 9,
            adaptiveFiltering: true,
          })
          .toFile(tmpOut);
      } else if (detectedMime === 'image/jpeg') {
        await sharp(absPath)
          .jpeg({
            quality: 72,
            mozjpeg: true,
            progressive: true,
            chromaSubsampling: '4:2:0',
          })
          .toFile(tmpOut);
      } else if (detectedMime === 'application/pdf') {
        // Read env configuration
        const gsPath = this.getGhostscriptPath();
        const preset = this.getPdfPreset();

        try {
          const buffer = await compressPdf(absPath, {
            resolution: preset, // 'screen' | 'ebook' | 'printer' | 'prepress'
            compatibilityLevel: 1.4,
            removePasswordAfterCompression: true,
            ...(gsPath ? { gsModule: gsPath } : {}), // explicit GS path for Windows/MSYS
          });
          await fsp.writeFile(tmpOut, buffer);
        } catch (pdfErr) {
          // Graceful fallback: keep original if Ghostscript not reachable or failed
          console.warn(
            `[PDF] compression skipped: ${pdfErr instanceof Error ? pdfErr.message : String(pdfErr)}`,
          );
          await fsp.copyFile(absPath, tmpOut);
        }
      } else if (
        detectedMime ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        const inputBuf = await fsp.readFile(absPath);
        const zip = await JSZip.loadAsync(inputBuf);

        // Optional cleanup to shave bytes
        const calcChainPath = 'xl/calcChain.xml';
        if (zip.file(calcChainPath)) {
          zip.remove(calcChainPath);
        }

        const outBuf = await zip.generateAsync({
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: { level: 9 },
        });
        await fsp.writeFile(tmpOut, outBuf);
      }

      // Compare sizes and keep the better one
      const statAfter = await fsp.stat(tmpOut);
      const compressedSizeBytesCandidate = statAfter.size;

      if (compressedSizeBytesCandidate < originalSizeBytes) {
        // Replace original with compressed
        await fsp.rename(tmpOut, absPath);
      } else {
        // Compression did not help; discard tmp
        await fsp.unlink(tmpOut).catch(() => {});
      }

      const finalStat = await fsp.stat(absPath);
      const finalSize = finalStat.size;
      const savedBytes = originalSizeBytes - finalSize;
      const savedPercent =
        originalSizeBytes > 0
          ? Number(((1 - finalSize / originalSizeBytes) * 100).toFixed(2))
          : 0;

      return {
        filePath: this.toRelative(absPath),
        originalSizeBytes,
        compressedSizeBytes: finalSize,
        savedBytes,
        savedPercent,
        mimeType: detectedMime,
      };
    } catch (err) {
      // Clean up tmp if present
      await fsp.unlink(tmpOut).catch(() => {});
      throw new BadRequestException(
        `Compression failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Delete investor document file
   */
  async deleteDocument(documentPath: string): Promise<boolean> {
    try {
      if (fs.existsSync(documentPath)) {
        fs.unlinkSync(documentPath);
        console.log('✅ Document deleted:', documentPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      throw new BadRequestException('Failed to delete document');
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: Express.Multer.File): void {
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum limit of 10MB. Received: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed types: PDF, JPEG, PNG, DOCX, DOC, XLSX`,
      );
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File is empty');
    }
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log('📁 Created directory:', dirPath);
    }
  }

  private toRelative(p: string) {
    const abs = p.replace(/\\/g, '/');
    const cwd = process.cwd().replace(/\\/g, '/');
    return abs.startsWith(cwd) ? abs.slice(cwd.length + 1) : abs;
  }
}
