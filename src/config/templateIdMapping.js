// Template ID to readable name mapping
export const templateIdMapping = {
    'HX8ee095a949665b2a240ad62e1bf8bd83': 'Patient Lifestyle Assessment',
    // Add more template ID mappings here as needed
    // 'HX_ANOTHER_ID': 'Another Template Name',
};

// Helper function to get readable name from template ID
export const getTemplateDisplayName = (templateId) => {
    return templateIdMapping[templateId] || templateId;
};