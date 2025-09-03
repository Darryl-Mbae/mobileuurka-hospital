import React, { useState } from 'react';
import { MESSAGE_HANDLERS } from '../config/messageHandlerConfig.js';
import '../css/FlowConfig.css';

const FlowConfig = () => {
  const [selectedFlow, setSelectedFlow] = useState('lifestyle_assessment');
  const [editMode, setEditMode] = useState(false);
  const [configData, setConfigData] = useState(MESSAGE_HANDLERS);

  const handleFlowSelect = (flowType) => {
    setSelectedFlow(flowType);
    setEditMode(false);
  };

  const handleFieldMappingChange = (questionKey, dbField) => {
    setConfigData(prev => ({
      ...prev,
      [selectedFlow]: {
        ...prev[selectedFlow],
        dbConfig: {
          ...prev[selectedFlow].dbConfig,
          fieldMapping: {
            ...prev[selectedFlow].dbConfig.fieldMapping,
            [questionKey]: dbField
          }
        }
      }
    }));
  };

  const addNewMapping = () => {
    const questionKey = prompt('Enter the flow question key (e.g., "Do_you_smoke?"):');
    const dbField = prompt('Enter the database field name (e.g., "smoking"):');
    
    if (questionKey && dbField) {
      handleFieldMappingChange(questionKey, dbField);
    }
  };

  const removeMapping = (questionKey) => {
    setConfigData(prev => {
      const newFieldMapping = { ...prev[selectedFlow].dbConfig.fieldMapping };
      delete newFieldMapping[questionKey];
      
      return {
        ...prev,
        [selectedFlow]: {
          ...prev[selectedFlow],
          dbConfig: {
            ...prev[selectedFlow].dbConfig,
            fieldMapping: newFieldMapping
          }
        }
      };
    });
  };

  const saveConfig = () => {
    // In a real app, you'd save this to a file or database
    console.log('Updated config:', configData);
    alert('Configuration saved! (Check console for details)');
    setEditMode(false);
  };

  const currentFlow = configData[selectedFlow];

  return (
    <div className="flow-config-container">
      <div className="flow-config-header">
        <h1>WhatsApp Flow Configuration</h1>
        <p>Configure how WhatsApp flow responses are mapped to database fields</p>
      </div>

      <div className="flow-config-content">
        {/* Flow Selection Sidebar */}
        <div className="flow-sidebar">
          <h3>Flow Types</h3>
          <div className="flow-list">
            {Object.entries(configData).map(([flowType, config]) => (
              <div
                key={flowType}
                className={`flow-item ${selectedFlow === flowType ? 'active' : ''}`}
                onClick={() => handleFlowSelect(flowType)}
              >
                <span className="flow-icon">{config.icon}</span>
                <div className="flow-info">
                  <div className="flow-title">{config.title}</div>
                  <div className="flow-model">Model: {config.dbConfig?.modelName || 'Not configured'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="config-panel">
          {currentFlow && (
            <>
              <div className="config-header">
                <h2>
                  <span className="config-icon">{currentFlow.icon}</span>
                  {currentFlow.title}
                </h2>
                <button
                  className={`edit-btn ${editMode ? 'save' : 'edit'}`}
                  onClick={editMode ? saveConfig : () => setEditMode(true)}
                >
                  {editMode ? 'Save Changes' : 'Edit Configuration'}
                </button>
              </div>

              <div className="config-sections">
                {/* Basic Info */}
                <div className="config-section">
                  <h3>Basic Information</h3>
                  <div className="config-grid">
                    <div className="config-field">
                      <label>Title:</label>
                      <input
                        type="text"
                        value={currentFlow.title}
                        disabled={!editMode}
                        onChange={(e) => setConfigData(prev => ({
                          ...prev,
                          [selectedFlow]: { ...prev[selectedFlow], title: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="config-field">
                      <label>Icon:</label>
                      <input
                        type="text"
                        value={currentFlow.icon}
                        disabled={!editMode}
                        onChange={(e) => setConfigData(prev => ({
                          ...prev,
                          [selectedFlow]: { ...prev[selectedFlow], icon: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="config-field">
                      <label>Database Model:</label>
                      <input
                        type="text"
                        value={currentFlow.dbConfig?.modelName || ''}
                        disabled={!editMode}
                        onChange={(e) => setConfigData(prev => ({
                          ...prev,
                          [selectedFlow]: {
                            ...prev[selectedFlow],
                            dbConfig: { ...prev[selectedFlow].dbConfig, modelName: e.target.value }
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Keywords */}
                <div className="config-section">
                  <h3>Detection Keywords</h3>
                  <div className="keywords-list">
                    {currentFlow.keywords.map((keyword, index) => (
                      <span key={index} className="keyword-tag">{keyword}</span>
                    ))}
                  </div>
                </div>

                {/* Field Mapping */}
                <div className="config-section">
                  <h3>Field Mapping</h3>
                  <div className="mapping-header">
                    <span>Flow Question Key</span>
                    <span>Database Field</span>
                    {editMode && <span>Actions</span>}
                  </div>
                  
                  {currentFlow.dbConfig?.fieldMapping && Object.entries(currentFlow.dbConfig.fieldMapping).map(([questionKey, dbField]) => (
                    <div key={questionKey} className="mapping-row">
                      <div className="question-key">{questionKey}</div>
                      <div className="db-field">
                        {editMode ? (
                          <input
                            type="text"
                            value={dbField}
                            onChange={(e) => handleFieldMappingChange(questionKey, e.target.value)}
                          />
                        ) : (
                          <span>{dbField}</span>
                        )}
                      </div>
                      {editMode && (
                        <div className="mapping-actions">
                          <button
                            className="remove-btn"
                            onClick={() => removeMapping(questionKey)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {editMode && (
                    <div className="add-mapping">
                      <button className="add-btn" onClick={addNewMapping}>
                        + Add New Mapping
                      </button>
                    </div>
                  )}
                </div>

                {/* Preview */}
                <div className="config-section">
                  <h3>Configuration Preview</h3>
                  <pre className="config-preview">
                    {JSON.stringify(currentFlow, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlowConfig;