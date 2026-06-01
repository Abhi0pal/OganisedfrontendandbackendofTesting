/**
 * Utility functions for generating formatted IDs for Tenant, Project, and Module
 * Format: PREFIX_NUMBER (e.g., TN_001, PR_001, MOD_001)
 */

/**
 * Generates a formatted Tenant ID from database ID
 * Format: TN_XXX where XXX is zero-padded ID
 * @param id Database auto-increment ID
 * @returns Formatted Tenant ID (e.g., TN_001, TN_002)
 */
export function generateTenantId(id: number): string {
    return `TN_${String(id).padStart(3, '0')}`;
}

/**
 * Generates a formatted Project ID from database ID
 * Format: PR_XXX where XXX is zero-padded ID
 * @param id Database auto-increment ID
 * @returns Formatted Project ID (e.g., PR_001, PR_002)
 */
export function generateProjectId(id: number): string {
    return `PR_${String(id).padStart(3, '0')}`;
}

/**
 * Generates a formatted Module ID from database ID
 * Format: MOD_XXX where XXX is zero-padded ID
 * @param id Database auto-increment ID
 * @returns Formatted Module ID (e.g., MOD_001, MOD_002)
 */
export function generateModuleId(id: number): string {
    return `MOD_${String(id).padStart(3, '0')}`;
}

/**
 * Generates a project code from project name and start year
 * Format: <ABBREV>_<YEAR> where ABBREV is first 3 letters of project name
 * @param projectName Project name
 * @param startYear Start year (required)
 * @returns Project code (e.g., BUI_2024, PRO_2025)
 */
export function generateProjectCode(projectName: string, startYear: number): string {
    if (!projectName || !startYear) {
        throw new Error('Project name and start year are required');
    }

    // Get first 3 letters of project name, uppercase, remove spaces
    const abbrev = projectName
        .substring(0, 3)
        .toUpperCase()
        .replace(/\s+/g, '');

    return `${abbrev}_${startYear}`;
}

/**
 * Generates a module code from module name
 * Format: <ABBREV>_<SEQ> where ABBREV is first letter of each word
 * @param moduleName Module name
 * @param sequenceNumber Optional sequence number (if not provided, will be just the abbreviation)
 * @returns Module code (e.g., UM_001, RP_002)
 */
export function generateModuleCode(moduleName: string, sequenceNumber?: number): string {
    if (!moduleName) {
        throw new Error('Module name is required');
    }

    // Get first letter of each word, uppercase
    const words = moduleName.split(/\s+/).filter((w) => w.length > 0);
    const abbrev = words.map((word) => word[0].toUpperCase()).join('');

    // If sequence number provided, add it
    if (sequenceNumber !== undefined) {
        return `${abbrev}_${String(sequenceNumber).padStart(3, '0')}`;
    }

    return abbrev;
}
