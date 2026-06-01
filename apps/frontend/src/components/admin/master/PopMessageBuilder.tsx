"use client";

import { InputTextarea } from "primereact/inputtextarea";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { useState } from "react";

interface Props {
  value: any;
  onChange: (val: any) => void;
}

const headingOptions = [
  { label: "Normal", value: "p" },
  { label: "Small", value: "small" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Heading 4", value: "h4" },
  { label: "Heading 5", value: "h5" },
  { label: "Heading 6", value: "h6" },
];

export const PopMessageBuilder = ({ value, onChange }: Props) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const config = value || { enabled: true, sections: [] };

  const updateSection = (index: number, data: any) => {
    const sections = [...config.sections];
    sections[index] = data;
    onChange({ ...config, sections });
  };

  const addSection = (type: string) => {
    const newSection: any = {
      type,
      heading: "p",
      bold: false,
      italic: false,
      muted: false,
      spacing: "mb-3",
    };
    if (type === "paragraph") newSection.content = "";
    if (type === "bullets" || type === "documents") newSection.items = [];
    if (type === "table") newSection.headers = ["", ""];
    newSection.rows = [];
    onChange({ ...config, sections: [...(config.sections || []), newSection] });
  };

  const moveSection = (from: number, to: number) => {
    if (to < 0 || to >= config.sections.length) return;
    const sections = [...config.sections];
    const [moved] = sections.splice(from, 1);
    sections.splice(to, 0, moved);
    onChange({ ...config, sections });
  };

  const deleteSection = (index: number) => {
    const sections = config.sections.filter((_: any, i: number) => i !== index);
    onChange({ ...config, sections });
  };

  return (
    <div className="d-flex flex-column gap-3">
      <h5 className="mb-1">Pop-up Message Configuration</h5>
      <div className="card p-3">
        {/* Enable Popup */}
        <div className="mb-3 border rounded p-3 d-flex align-items-start gap-2">
          <Checkbox
            checked={config.enabled ?? true}
            onChange={(e) => onChange({ ...config, enabled: e.checked })}
          />
          <div>
            <label className="fw-semibold d-block">
              Enable Pre-Form Pop-up
            </label>
            <small className="text-muted">
              When enabled, a pre-form pop-up message will be displayed,
              requiring the investor to acknowledge and proceed.
            </small>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Popup Title</label>
          <InputText
            value={config.title || ""}
            className="w-100"
            placeholder="e.g. Important Instructions"
            onChange={(e) => onChange({ ...config, title: e.target.value })}
          />
        </div>

        <Divider />

        {/* Sections */}
        {config.sections?.map((section: any, index: number) => (
          <div key={index} className={`border rounded p-3 ${section.spacing}`}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="fw-semibold text-capitalize">{section.type}</div>
              <div className="d-flex gap-2">
                <Button
                  icon="pi pi-arrow-up"
                  rounded
                  text
                  severity="secondary"
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveSection(index, index - 1)}
                  tooltip="Move Up"
                />
                <Button
                  icon="pi pi-arrow-down"
                  rounded
                  text
                  type="button"
                  severity="secondary"
                  disabled={index === config.sections.length - 1}
                  onClick={() => moveSection(index, index + 1)}
                  tooltip="Move Down"
                />
                <Button
                  icon="pi pi-trash"
                  rounded
                  text
                  type="button"
                  severity="danger"
                  onClick={() => deleteSection(index)}
                  tooltip="Delete Section"
                />
              </div>
            </div>

            {/* Paragraph */}
            {section.type === "paragraph" && (
              <>
                <div className="d-flex gap-2 mb-2">
                  <Dropdown
                    value={section.heading}
                    options={headingOptions}
                    onChange={(e) =>
                      updateSection(index, { ...section, heading: e.value })
                    }
                    placeholder="Heading level"
                  />
                  <Checkbox
                    checked={section.bold}
                    onChange={(e) =>
                      updateSection(index, {
                        ...section,
                        bold: e.checked ?? false,
                      })
                    }
                  />{" "}
                  <span>Bold</span>
                  <Checkbox
                    checked={section.italic}
                    onChange={(e) =>
                      updateSection(index, {
                        ...section,
                        italic: e.checked ?? false,
                      })
                    }
                  />{" "}
                  <span>Italic</span>
                  <Checkbox
                    checked={section.muted}
                    onChange={(e) =>
                      updateSection(index, {
                        ...section,
                        muted: e.checked ?? false,
                      })
                    }
                  />{" "}
                  <span>Muted</span>
                </div>
                <InputTextarea
                  rows={4}
                  className="w-100"
                  placeholder="Enter paragraph text"
                  value={section.content}
                  onChange={(e) =>
                    updateSection(index, {
                      ...section,
                      content: e.target.value,
                    })
                  }
                />
              </>
            )}

            {/* Bullets / Documents */}
            {(section.type === "bullets" || section.type === "documents") && (
              <InputTextarea
                rows={4}
                className="w-100"
                placeholder="Enter one item per line (max 8–10)"
                value={(section.items || []).join("\n")}
                onChange={(e) =>
                  updateSection(index, {
                    ...section,
                    items: e.target.value.split("\n").slice(0, 10),
                  })
                }
              />
            )}

            {/* Table */}
            {section.type === "table" && (
              <div className="d-flex flex-column gap-3">
                <InputText
                  className="w-100 font-monospace"
                  placeholder="Table Headers (comma separated)"
                  value={(section.headers || []).join(",")}
                  onChange={(e) =>
                    updateSection(index, {
                      ...section,
                      headers: e.target.value.split(","),
                    })
                  }
                />
                <InputTextarea
                  rows={4}
                  className="w-100 font-monospace"
                  placeholder="Rows, one per line, comma separated"
                  value={(section.rows || [])
                    .map((r: any) => r.join(","))
                    .join("\n")}
                  onChange={(e) =>
                    updateSection(index, {
                      ...section,
                      rows: e.target.value
                        .split("\n")
                        .filter(Boolean)
                        .map((l) => l.split(",")),
                    })
                  }
                />
              </div>
            )}
          </div>
        ))}

        {/* Add Section Buttons */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="d-flex gap-2 flex-wrap">
            <Button
              label="Add Paragraph"
              type="button"
              onClick={() => addSection("paragraph")}
            />
            <Button
              label="Add Bullets"
              type="button"
              onClick={() => addSection("bullets")}
            />
            <Button
              label="Add Table"
              type="button"
              onClick={() => addSection("table")}
            />
            <Button
              label="Add Document List"
              onClick={() => addSection("documents")}
            />
          </div>
          <Button
            icon="pi pi-eye"
            label="Preview Popup"
            severity="info"
            outlined
            type="button"
            onClick={() => setShowPreview(true)}
          />
        </div>

        <Divider />

        <div className="mb-3">
          <label className="form-label fw-semibold">
            Acknowledgement Button Text
          </label>
          <InputText
            value={config.acknowledgement_text || ""}
            className="w-100"
            placeholder="e.g. I have read and understood"
            onChange={(e) =>
              onChange({ ...config, acknowledgement_text: e.target.value })
            }
          />
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <Dialog
            header={config.title || "Popup Preview"}
            visible={showPreview}
            style={{ width: "60vw" }}
            onHide={() => setShowPreview(false)}
            modal
          >
            <div className="p-3">
              {config.sections?.map((section: any, index: number) => (
                <div key={index} className={`${section.spacing} mb-3`}>
                  {/* Paragraph */}
                  {section.type === "paragraph" && (
                    <div
                      style={{
                        fontWeight: section.bold ? 600 : 400,
                        fontStyle: section.italic ? "italic" : "normal",
                      }}
                    >
                      {section.heading === "p" ? (
                        <p className={section.muted ? "text-muted" : ""}>
                          {section.content}
                        </p>
                      ) : section.heading === "small" ? (
                        <small className={section.muted ? "text-muted" : ""}>
                          {section.content}
                        </small>
                      ) : section.heading === "h1" ? (
                        <h1 className={section.muted ? "text-muted" : ""}>
                          {section.content}
                        </h1>
                      ) : section.heading === "h2" ? (
                        <h2 className={section.muted ? "text-muted" : ""}>
                          {section.content}
                        </h2>
                      ) : section.heading === "h3" ? (
                        <h3 className={section.muted ? "text-muted" : ""}>
                          {section.content}
                        </h3>
                      ) : section.heading === "h4" ? (
                        <h4 className={section.muted ? "text-muted" : ""}>
                          {section.content}
                        </h4>
                      ) : section.heading === "h5" ? (
                        <h5 className={section.muted ? "text-muted" : ""}>
                          {section.content}
                        </h5>
                      ) : section.heading === "h6" ? (
                        <h6 className={section.muted ? "text-muted" : ""}>
                          {section.content}
                        </h6>
                      ) : (
                        <p className={section.muted ? "text-muted" : ""}>
                          {section.content}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Bullets */}
                  {section.type === "bullets" && (
                    <ul className="ps-3">
                      {section.items?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}

                  {/* Documents */}
                  {section.type === "documents" && (
                    <div className="d-flex flex-column gap-1">
                      <div className="d-flex align-items-center gap-2">
                        <i
                          className="pi pi-file"
                          style={{ fontSize: "1.2rem" }}
                        ></i>
                        <h6 className="fw-semibold mb-0">
                          Documents Required:
                        </h6>
                      </div>
                      <ul className="ps-3 mb-0">
                        {section.items?.map((doc: string, i: number) => (
                          <li key={i}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Table */}
                  {section.type === "table" && (
                    <table className="table table-bordered mt-2">
                      <thead>
                        <tr>
                          {section.headers?.map((h: string, i: number) => (
                            <th key={i}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows?.map((row: any[], rIdx: number) => (
                          <tr key={rIdx}>
                            {row.map((cell: string, cIdx: number) => (
                              <td key={cIdx}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}

              {/* Acknowledgement */}
              <div className="mt-4 d-flex align-items-center gap-2">
                <Checkbox
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.checked ?? false)}
                />
                <label className="mb-0">
                  {config.acknowledgement_text || "I have read and understood"}
                </label>
              </div>

              <div className="mt-3 text-end">
                <Button
                  label="I agree & continue"
                  disabled={!acknowledged}
                  onClick={() => setShowPreview(false)}
                />
              </div>
            </div>
          </Dialog>
        )}
      </div>
    </div>
  );
};
