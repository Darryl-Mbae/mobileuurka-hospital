// Configuration for handling different types of incoming WhatsApp messages

export const MESSAGE_HANDLERS = {
    // Lifestyle Assessment Flow
    lifestyle_assessment: {
        keywords: ['lifestyle', 'flowdata', 'lifestyle_assessment'],
        title: 'Lifestyle Assessment Completed',
        icon: '📋',
        cardClass: 'flow-response-card',
        // Database configuration
        dbConfig: {
            modelName: 'patientlifestyle',
            fieldMapping: {
                // Map flow question keys to database field names
                'Do_you_smoke?': 'smoking',
                'Select_diet_type': 'diet',
                'How_often_do_you_drink_alcohol': 'alcoholConsumption',
                'Do_you_take_caffeine_?': 'caffeine',
                'Do_you__take_sugary_drinks_?': 'sugarDrink',
                // Add more mappings as needed
            }
        }
    },

    // Medication Adherence Flow
    medication_adherence: {
        keywords: ['medication', 'adherence', 'medication_adherence'],
        title: 'Medication Adherence Survey Completed',
        icon: '💊',
        cardClass: 'flow-response-card',
        dbConfig: {
            modelName: 'medication',
            fieldMapping: {
                'medication_name': 'name',
                'dosage': 'dosage',
                'frequency': 'frequency',
                'adherence_level': 'adherenceLevel'
            }
        }
    },

    // Symptom Tracker Flow
    symptom_tracker: {
        keywords: ['symptom', 'tracker', 'symptoms', 'symptom_tracker'],
        title: 'Symptom Tracker Completed',
        icon: '🩺',
        cardClass: 'flow-response-card',
        dbConfig: {
            modelName: 'symptom',
            fieldMapping: {
                'symptom_type': 'type',
                'severity': 'severity',
                'duration': 'duration',
                'description': 'description'
            }
        }
    },

    // Appointment Feedback Flow
    appointment_feedback: {
        keywords: ['appointment', 'feedback', 'satisfaction', 'appointment_feedback'],
        title: 'Appointment Feedback Completed',
        icon: '⭐',
        cardClass: 'flow-response-card',
        dbConfig: {
            modelName: 'note',
            fieldMapping: {
                'satisfaction_rating': 'rating',
                'feedback_comments': 'content',
                'appointment_date': 'appointmentDate'
            }
        }
    },

    // Mental Health Assessment Flow
    mental_health: {
        keywords: ['mental', 'health', 'mood', 'anxiety', 'depression', 'mental_health'],
        title: 'Mental Health Assessment Completed',
        icon: '🧠',
        cardClass: 'flow-response-card',
        dbConfig: {
            modelName: 'symptom',
            fieldMapping: {
                'mood_level': 'moodLevel',
                'anxiety_level': 'anxietyLevel',
                'depression_symptoms': 'depressionSymptoms'
            }
        }
    },

    // Pain Assessment Flow
    pain_assessment: {
        keywords: ['pain', 'assessment', 'pain_level', 'discomfort'],
        title: 'Pain Assessment Completed',
        icon: '🩹',
        cardClass: 'flow-response-card',
        dbConfig: {
            modelName: 'symptom',
            fieldMapping: {
                'pain_level': 'severity',
                'pain_location': 'location',
                'pain_type': 'type',
                'pain_duration': 'duration'
            }
        }
    }
};

// Helper function to detect message type from webhook data
export const detectMessageType = (webhookData) => {
    const webhookStr = JSON.stringify(webhookData).toLowerCase();

    // Check each handler to find a match
    for (const [messageType, config] of Object.entries(MESSAGE_HANDLERS)) {
        if (config.keywords.some(keyword => webhookStr.includes(keyword))) {
            return messageType;
        }
    }

    return null; // Unknown message type
};

// Helper function to get handler config
export const getMessageHandler = (messageType) => {
    return MESSAGE_HANDLERS[messageType] || null;
};

// Helper function to parse flow data from webhook
export const parseFlowData = (flowDataInput) => {
    try {
        console.log('Input type:', typeof flowDataInput);
        console.log('Input value:', flowDataInput);
        console.log('Input constructor:', flowDataInput.constructor.name);

        // Parse the input to get a proper object
        let parsedData;
        if (typeof flowDataInput === 'string') {
            console.log('Attempting to parse string...');
            let firstParse = JSON.parse(flowDataInput);
            console.log('First parse result type:', typeof firstParse);

            // If first parse is still a string, parse again (double-encoded JSON)
            if (typeof firstParse === 'string') {
                console.log('Double-encoded JSON detected, parsing again...');
                parsedData = JSON.parse(firstParse);
            } else {
                parsedData = firstParse;
            }
            console.log('Final parse result type:', typeof parsedData);
            console.log('Final parse result:', parsedData);
        } else {
            parsedData = flowDataInput;
        }

        console.log('Final parsedData type:', typeof parsedData);
        console.log('Final parsedData:', parsedData);
        console.log('Is array?', Array.isArray(parsedData));
        console.log('Object.keys result:', Object.keys(parsedData));

        const responses = [];

        // Process Lifestyle_assessment_a
        if (parsedData.Lifestyle_assessment_a) {
            const section = parsedData.Lifestyle_assessment_a;
            Object.keys(section).forEach(questionKey => {
                const question = questionKey.replace(/_/g, ' ').replace(/\?/g, '?');
                const answer = section[questionKey];
                responses.push({ question, answer });
            });
        }

        // Process Lifestyle_assessment_b  
        if (parsedData.Lifestyle_assessment_b) {
            const section = parsedData.Lifestyle_assessment_b;
            Object.keys(section).forEach(questionKey => {
                const question = questionKey.replace(/_/g, ' ').replace(/\?/g, '?');
                const answer = section[questionKey];
                responses.push({ question, answer });
            });
        }

        console.log('Parsed responses count:', responses.length);
        return responses;
    } catch (error) {
        console.error('Error parsing flow data:', error);
        console.error('Input was:', flowDataInput);
        return [];
    }
};
// Helper function to transform flow data to database format
export const transformFlowDataForDB = (flowResponses, handler) => {
    if (!handler.dbConfig || !handler.dbConfig.fieldMapping) {
        return null;
    }

    const dbData = {};
    const fieldMapping = handler.dbConfig.fieldMapping;

    // Transform each flow response to database field
    flowResponses.forEach(response => {
        const questionKey = response.question.replace(/\s+/g, '_').replace(/\?/g, '?');
        const dbFieldName = fieldMapping[questionKey];

        if (dbFieldName) {
            dbData[dbFieldName] = response.answer;
        }
    });

    return dbData;
};

// Helper function to save flow data to database
export const saveFlowDataToDB = async (webhookData, patientId, serverUrl, messageType) => {
    const handler = getMessageHandler(messageType);

    if (!handler || !handler.dbConfig) {
        return { success: false, error: 'No database configuration' };
    }

    const flowData = webhookData.FlowData;
    if (!flowData) {
        return { success: false, error: 'No flow data found' };
    }

    const flowResponses = parseFlowData(flowData);
    if (flowResponses.length === 0) {
        return { success: false, error: 'No responses found in flow data' };
    }

    // Transform flow data to database format
    const dbData = transformFlowDataForDB(flowResponses, handler);
    if (!dbData) {
        return { success: false, error: 'Failed to transform flow data' };
    }

    try {
        const requestBody = {
            patientId: patientId,
            ...dbData,
            editor: "self assessment"
        };



        const response = await fetch(`${serverUrl}/patients/medical/${handler.dbConfig.modelName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();

        return {
            success: true,
            data: result,
            messageType,
            successMessage: `${handler.title.replace(' Completed', '')} has been saved to medical records.`
        };
    } catch (error) {
        console.error(`Error saving ${messageType} data:`, error);
        return { success: false, error: error.message };
    }
};