document.addEventListener('DOMContentLoaded', () => {
    // Add global Enter key handler for the name input
    setupGlobalEventHandlers();
    
    // Initialize with configure context menu options
    tableau.extensions.initializeAsync({'configure': configure}).then(() => {
        // Check if we already have a stored username
        const storedUserName = getStoredUserName();
        
        if (storedUserName) {
            // User already identified, proceed
            showAppropriateView(storedUserName);
        } else {
            // Show name prompt
            showNamePrompt();
        }
    }).catch(error => {
        // Handle initialization errors
        console.error('Error initializing extension:', error);
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h2>Extension Error</h2>
                <p>There was an error initializing the extension. Please reload the page.</p>
                <p>Error details: ${error.message}</p>
            </div>
        `;
    });
});

function setupGlobalEventHandlers() {
    // Add reset button to clear stored data (useful for testing)
    const buttonContainer = document.getElementById('buttonContainer');
    if (buttonContainer) {
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Reset Extension';
        resetButton.style.position = 'absolute';
        resetButton.style.bottom = '10px';
        resetButton.style.right = '10px';
        resetButton.style.fontSize = '10px';
        resetButton.style.padding = '2px 5px';
        resetButton.style.opacity = '0.7';
        
        resetButton.addEventListener('click', () => {
            if (confirm('This will reset the extension and clear all stored data. Continue?')) {
                // Show a loading indicator
                document.body.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
                        <p>Resetting extension...</p>
                        <p>The extension will reload automatically.</p>
                    </div>
                `;
                
                // Clear all browser storage
                try {
                    localStorage.clear();
                    sessionStorage.clear();
                } catch (e) {
                    console.error('Error clearing browser storage:', e);
                }
                
                // Clear Tableau extension settings
                // Note: tableau.extensions.settings.clear() doesn't exist in the API
                // Instead, we need to erase settings by erasing keys individually
                try {
                    // Get existing settings
                    const savedConfig = tableau.extensions.settings.get('checkoutConfig');
                    if (savedConfig) {
                        // Erase the settings by setting it to an empty string
                        tableau.extensions.settings.set('checkoutConfig', '');
                    }
                    
                    // Save the cleared settings
                    tableau.extensions.settings.saveAsync()
                        .then(() => {
                            console.log('Settings cleared successfully');
                            
                            // Use Tableau's own extension reload method if available
                            try {
                                // First try Tableau's extension reload method
                                if (tableau.extensions.ui && typeof tableau.extensions.ui.closeDialog === 'function') {
                                    // If in a dialog, try to close and reopen
                                    console.log('Attempting to reload via Tableau Extensions API...');
                                    
                                    // Request a reload from Tableau
                                    tableau.extensions.ui.closeDialog('reload');
                                } else {
                                    // Fall back to standard browser reload
                                    console.log('Falling back to browser reload...');
                                    window.location.reload(true);
                                    
                                    // Fallback mechanism
                                    setTimeout(() => {
                                        document.body.innerHTML = `
                                            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
                                                <p>Please manually reload the extension by:</p>
                                                <p>1. Right-clicking on the extension</p>
                                                <p>2. Selecting "Reload" from the menu</p>
                                                <button onclick="window.location.reload(true)" style="margin-top: 20px; padding: 10px;">
                                                    Try Reload Again
                                                </button>
                                            </div>
                                        `;
                                    }, 2000);
                                }
                            } catch (e) {
                                console.error('Error reloading extension:', e);
                                // Last resort - give user manual instructions
                                document.body.innerHTML = `
                                    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
                                        <p>Unable to automatically reload. Please manually reload the extension by:</p>
                                        <p>1. Right-clicking on the extension</p>
                                        <p>2. Selecting "Reload" from the menu</p>
                                        <button onclick="window.location.reload(true)" style="margin-top: 20px; padding: 10px;">
                                            Try Reload Again
                                        </button>
                                    </div>
                                `;
                            }
                        })
                        .catch(error => {
                            console.error('Error saving cleared settings:', error);
                            document.body.innerHTML = `
                                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; color: #f44336;">
                                    <p>Error resetting extension: ${error.message}</p>
                                    <p>Please manually reload the extension by:</p>
                                    <p>1. Right-clicking on the extension</p>
                                    <p>2. Selecting "Reload" from the menu</p>
                                    <button onclick="window.location.reload(true)" style="margin-top: 20px; padding: 10px;">
                                        Try Reload Again
                                    </button>
                                </div>
                            `;
                        });
                } catch (error) {
                    console.error('Error during reset process:', error);
                    document.body.innerHTML = `
                        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; color: #f44336;">
                            <p>Error resetting extension: ${error.message}</p>
                            <p>Please manually reload the extension by:</p>
                            <p>1. Right-clicking on the extension</p>
                            <p>2. Selecting "Reload" from the menu</p>
                            <button onclick="window.location.reload(true)" style="margin-top: 20px; padding: 10px;">
                                Try Reload Again
                            </button>
                        </div>
                    `;
                }
            }
        });
        
        buttonContainer.appendChild(resetButton);
    }
}

function configure() {
    // Show configuration when the context menu option is clicked
    showConfig();
}

// Get username from storage (sessionStorage or localStorage based on remember setting)
function getStoredUserName() {
    try {
        const savedUserName = localStorage.getItem('tableauExtensionUserName');
        const sessionUserName = sessionStorage.getItem('tableauExtensionUserName');
        
        console.log('Stored usernames:', { localStorage: savedUserName, sessionStorage: sessionUserName });
        
        return sessionUserName || savedUserName;
    } catch (error) {
        console.error('Error getting stored username:', error);
        return null;
    }
}

// Set username in storage
function setStoredUserName(userName, remember) {
    try {
        console.log('Setting username:', userName, 'remember:', remember);
        
        if (remember) {
            localStorage.setItem('tableauExtensionUserName', userName);
        } else {
            // Clear localStorage in case it was previously set
            localStorage.removeItem('tableauExtensionUserName');
        }
        
        // Always set in session storage
        sessionStorage.setItem('tableauExtensionUserName', userName);
    } catch (error) {
        console.error('Error storing username:', error);
    }
}

// Show name prompt view
function showNamePrompt() {
    const namePromptContainer = document.getElementById('namePromptContainer');
    const configSection = document.getElementById('configSection');
    const buttonContainer = document.getElementById('buttonContainer');
    
    // Make sure other sections are hidden
    namePromptContainer.style.display = 'flex';
    configSection.classList.add('hidden');
    buttonContainer.classList.add('hidden');
    
    // Clear any previous input value
    const nameInput = document.getElementById('userNameInput');
    nameInput.value = '';
    
    // Focus on the input field
    setTimeout(() => nameInput.focus(), 100);
    
    // Remove any existing event listeners to prevent duplication
    const submitButton = document.getElementById('nameSubmitBtn');
    const newSubmitButton = submitButton.cloneNode(true);
    submitButton.parentNode.replaceChild(newSubmitButton, submitButton);
    
    // Add keypress event listener to the name input field
    nameInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitUserName();
        }
    });
    
    // Handle name submission with the new button reference
    newSubmitButton.addEventListener('click', submitUserName);
}

// Handle name submission
function submitUserName() {
    const nameInput = document.getElementById('userNameInput');
    const rememberUser = document.getElementById('rememberUser').checked;
    const userName = nameInput.value.trim();
    
    if (!userName) {
        alert('Please enter your name to continue');
        return;
    }
    
    // Store the username
    setStoredUserName(userName, rememberUser);
    
    // Update Tableau parameter if it exists
    updateCurrentUserParameter(userName);
    
    // Hide name prompt and show appropriate view
    document.getElementById('namePromptContainer').style.display = 'none';
    showAppropriateView(userName);
}

// New function to update the current_user parameter
async function updateCurrentUserParameter(userName) {
    try {
        // Get all parameters in the dashboard
        const parameters = await tableau.extensions.dashboardContent.dashboard.getParametersAsync();
        
        // Find the current_user parameter
        const currentUserParam = parameters.find(param => 
            param.name.toLowerCase() === 'current_user');
        
        // If the parameter exists, update its value
        if (currentUserParam) {
            console.log('Updating current_user parameter to:', userName);
            await currentUserParam.changeValueAsync(userName);
        } else {
            console.log('No current_user parameter found in the dashboard');
        }
    } catch (error) {
        console.error('Error updating current_user parameter:', error);
    }
}

// Show appropriate view based on existing configuration
function showAppropriateView(userName) {
    // Update the current_user parameter
    updateCurrentUserParameter(userName);
    
    const savedConfig = tableau.extensions.settings.get('checkoutConfig');
    
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        // Update current user in the config
        config.currentUser = userName;
        // Save updated config with current user
        tableau.extensions.settings.set('checkoutConfig', JSON.stringify(config));
        tableau.extensions.settings.saveAsync().then(() => {
            hideConfig();
            setupCheckoutListener(config);
        });
    } else {
        showConfig(userName);
    }
}

function showConfig(userName) {
    const configSection = document.getElementById('configSection');
    configSection.classList.remove('hidden');
    document.getElementById('namePromptContainer').style.display = 'none';
    
    // Use provided username or get from storage
    const currentUser = userName || getStoredUserName();
    
    // Load existing configuration if available
    const savedConfig = tableau.extensions.settings.get('checkoutConfig');
    let existingConfig = null;
    
    if (savedConfig) {
        existingConfig = JSON.parse(savedConfig);
        
        // Populate API config fields if they exist
        if (existingConfig.appScriptUrl) {
            document.getElementById('appScriptUrl').value = existingConfig.appScriptUrl;
        }
        
        if (existingConfig.apiKey) {
            document.getElementById('apiKey').value = existingConfig.apiKey;
        }
    }
    
    // Populate worksheet dropdown
    const worksheetSelect = document.getElementById('worksheetSelect');
    worksheetSelect.innerHTML = '<option value="" disabled selected>Select Worksheet</option>';
    
    const dashboard = tableau.extensions.dashboardContent.dashboard;
    dashboard.worksheets.forEach(worksheet => {
        const option = document.createElement('option');
        option.value = worksheet.name;
        option.textContent = worksheet.name;
        worksheetSelect.appendChild(option);
        
        // Select previously configured worksheet if available
        if (existingConfig && existingConfig.worksheetName === worksheet.name) {
            option.selected = true;
            // Trigger the change event to load columns
            const changeEvent = new Event('change');
            worksheetSelect.dispatchEvent(changeEvent);
        }
    });

    // Display current user
    const currentUserDisplay = document.getElementById('currentUserDisplay');
    if (currentUserDisplay) {
        currentUserDisplay.textContent = currentUser;
    }
    
    // Hide the custom username container as we're now always using user-provided name
    const customUsernameContainer = document.getElementById('customUsernameContainer');
    if (customUsernameContainer) {
        customUsernameContainer.style.display = 'none';
    }

    // Handle worksheet selection
    worksheetSelect.addEventListener('change', async () => {
        const worksheet = dashboard.worksheets.find(w => w.name === worksheetSelect.value);
        const columns = await getWorksheetColumns(worksheet);
        
        const columnsSelect = document.getElementById('columnsSelect');
        const accountIdColumn = document.getElementById('accountIdColumn');
        const statusColumn = document.getElementById('statusColumn');
        const userColumn = document.getElementById('userColumn');
        
        // Clear and repopulate dropdowns
        accountIdColumn.innerHTML = '<option value="" disabled selected>Select Column</option>';
        statusColumn.innerHTML = '<option value="" disabled selected>Select Column</option>';
        userColumn.innerHTML = '<option value="" disabled selected>Select Column</option>';
        
        columns.forEach(column => {
            // Account ID Column options
            const accOption = document.createElement('option');
            accOption.value = column;
            accOption.textContent = column;
            accountIdColumn.appendChild(accOption);
            
            // Select previously configured column if available
            if (existingConfig && existingConfig.accountIdColumn === column) {
                accOption.selected = true;
            }
            
            // Status Column options
            const statusOption = document.createElement('option');
            statusOption.value = column;
            statusOption.textContent = column;
            statusColumn.appendChild(statusOption);
            
            // Select previously configured column if available
            if (existingConfig && existingConfig.statusColumn === column) {
                statusOption.selected = true;
            }
            
            // User Column options
            const userOption = document.createElement('option');
            userOption.value = column;
            userOption.textContent = column;
            userColumn.appendChild(userOption);
            
            // Select previously configured column if available
            if (existingConfig && existingConfig.userColumn === column) {
                userOption.selected = true;
            }
        });
        
        columnsSelect.style.display = 'block';
        
        // Handle save button click
        document.getElementById('saveConfig').addEventListener('click', () => {
            const appScriptUrl = document.getElementById('appScriptUrl').value;
            const apiKey = document.getElementById('apiKey').value;
            
            if (!accountIdColumn.value || !statusColumn.value || !userColumn.value) {
                alert('Please select all required column fields');
                return;
            }
            
            if (!appScriptUrl) {
                alert('Please enter the Google Apps Script URL');
                return;
            }
            
            if (!apiKey) {
                alert('Please enter the API key');
                return;
            }
            
            const config = {
                worksheetName: worksheetSelect.value,
                accountIdColumn: accountIdColumn.value,
                statusColumn: statusColumn.value,
                userColumn: userColumn.value,
                currentUser: currentUser,
                appScriptUrl: appScriptUrl,
                apiKey: apiKey
            };
            
            // Save configuration
            tableau.extensions.settings.set('checkoutConfig', JSON.stringify(config));
            tableau.extensions.settings.saveAsync().then(() => {
                hideConfig();
                setupCheckoutListener(config);
            });
        });
    });
}

// We'll keep this for debugging, but it's no longer used for user identification
function getCurrentUser() {
    const environment = tableau.extensions.environment;
    const userInfo = environment.user;
    
    // Create a debug message with all available user information
    let debugInfo = 'User environment info:<br>';
    
    // Display the API version
    debugInfo += `<strong>API Version:</strong> ${environment.apiVersion}<br><br>`;
    
    // Check for uniqueUserId (added in API version 1.11.0)
    if (environment.uniqueUserId) {
        debugInfo += `<strong>Environment uniqueUserId:</strong> ${environment.uniqueUserId}<br><br>`;
    }
    
    // Display all available user properties for debugging
    if (userInfo) {
        debugInfo += '<strong>Available user properties:</strong><br>';
        for (const prop in userInfo) {
            debugInfo += `${prop}: ${userInfo[prop]}<br>`;
        }
    } else {
        debugInfo += 'No user information available from Tableau';
    }
    
    // Update the debug info on the page
    const debugElement = document.getElementById('userDebugInfo');
    if (debugElement) {
        debugElement.innerHTML = debugInfo;
    }
    
    // Return the stored user name instead of relying on Tableau
    return getStoredUserName() || 'Unknown User';
}

async function getWorksheetColumns(worksheet) {
    const dataTable = await worksheet.getSummaryDataAsync();
    return dataTable.columns.map(column => column.fieldName);
}

function hideConfig() {
    document.getElementById('configSection').classList.add('hidden');
    document.getElementById('buttonContainer').classList.remove('hidden');
}

function setupCheckoutListener(config) {
    const dashboard = tableau.extensions.dashboardContent.dashboard;
    const worksheet = dashboard.worksheets.find(w => w.name === config.worksheetName);
    const checkoutButton = document.getElementById('checkoutButton');
    
    // Display error if required config is missing
    if (!config.appScriptUrl || !config.apiKey) {
        checkoutButton.textContent = 'Configuration Error';
        checkoutButton.className = 'unavailable';
        checkoutButton.disabled = true;
        alert('API configuration is missing. Please reconfigure the extension.');
        return;
    }
    
    let accountId = '';
    let currentStatus = '';
    let currentUser = '';
    
    const updateButton = async () => {
        // Add a small delay to allow calculated field to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const dataTable = await worksheet.getSummaryDataAsync();
        const accountIdIndex = dataTable.columns.findIndex(col => col.fieldName === config.accountIdColumn);
        const statusIndex = dataTable.columns.findIndex(col => col.fieldName === config.statusColumn);
        const userIndex = dataTable.columns.findIndex(col => col.fieldName === config.userColumn);
        
        if (dataTable.data.length > 0 && accountIdIndex !== -1 && statusIndex !== -1 && userIndex !== -1) {
            // Get account ID, status, and user from the selected worksheet
            accountId = dataTable.data[0][accountIdIndex].value.toString();
            currentStatus = dataTable.data[0][statusIndex].value.toString();
            currentUser = dataTable.data[0][userIndex].value.toString();
            
            // Update button text and style based on status
            if (currentUser.toLowerCase() === 'available') {
                // Account is available for checkout
                checkoutButton.textContent = 'Check Out';
                checkoutButton.className = 'checkout';
                checkoutButton.disabled = false;
            } else if (currentUser.toLowerCase() === config.currentUser.toLowerCase()) {
                // Current user has this checked out
                checkoutButton.textContent = 'Check In';
                checkoutButton.className = 'checkin';
                checkoutButton.disabled = false;
            } else {
                // Someone else has this checked out
                checkoutButton.textContent = 'Currently Checked out by ' + currentUser;
                checkoutButton.className = 'unavailable';
                checkoutButton.disabled = true;
            }
        }
    };

    // Set up button click handler
    checkoutButton.addEventListener('click', async () => {
        if (checkoutButton.disabled) return;
        
        const action = checkoutButton.textContent === 'Check Out' ? 'Check Out' : 'Check In';
        const user = config.currentUser;
        
        // Prepare the payload for the POST request
        const payload = {
            accountId: accountId,
            user: user,
            action: action,
            apiKey: config.apiKey // Include the API key in the payload
        };
        
        try {
            // Show pending state on button
            const originalText = checkoutButton.textContent;
            checkoutButton.textContent = 'Processing...';
            checkoutButton.disabled = true;
            
            console.log('Sending request with payload:', { ...payload, apiKey: '[REDACTED]' });
            
            // Use XMLHttpRequest instead of fetch for better cross-origin support
            const xhr = new XMLHttpRequest();
            xhr.open('POST', config.appScriptUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            
            // Handle the response
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    console.log('Success:', xhr.responseText);
                    
                    // Update the button immediately
                    if (action === 'Check Out') {
                        checkoutButton.textContent = 'Check In';
                        checkoutButton.className = 'checkin';
                    } else {
                        checkoutButton.textContent = 'Check Out';
                        checkoutButton.className = 'checkout';
                    }
                    
                    // Force refresh the data source
                    refreshDataSources().then(() => {
                        // Then update the button state after data refresh
                        setTimeout(updateButton, 1000);
                        
                        // Show success message
                        alert(`${action} request completed successfully!`);
                    });
                } else {
                    console.error('Error response:', xhr.responseText);
                    alert(`Error: ${xhr.responseText || 'Unknown error'}`);
                    checkoutButton.textContent = originalText;
                    checkoutButton.disabled = false;
                }
            };
            
            // Handle network errors
            xhr.onerror = function() {
                console.error('Network error occurred');
                
                // Fallback to the form method if XHR fails due to CORS
                console.log('Falling back to form submission method');
                
                // Create an iframe to handle the form submission
                const iframeId = 'hidden-form-iframe';
                let iframe = document.getElementById(iframeId);
                
                if (!iframe) {
                    iframe = document.createElement('iframe');
                    iframe.id = iframeId;
                    iframe.name = iframeId;
                    iframe.style.display = 'none';
                    document.body.appendChild(iframe);
                }
                
                // Create a form that properly submits
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = config.appScriptUrl;
                form.target = iframe.name; // Target the iframe instead of _blank
                form.style.display = 'none';
                
                // Add individual form fields including the API key
                const accountIdInput = document.createElement('input');
                accountIdInput.type = 'hidden';
                accountIdInput.name = 'accountId';
                accountIdInput.value = payload.accountId;
                form.appendChild(accountIdInput);
                
                const userInput = document.createElement('input');
                userInput.type = 'hidden';
                userInput.name = 'user';
                userInput.value = payload.user;
                form.appendChild(userInput);
                
                const actionInput = document.createElement('input');
                actionInput.type = 'hidden';
                actionInput.name = 'action';
                actionInput.value = payload.action;
                form.appendChild(actionInput);
                
                const apiKeyInput = document.createElement('input');
                apiKeyInput.type = 'hidden';
                apiKeyInput.name = 'apiKey';
                apiKeyInput.value = payload.apiKey;
                form.appendChild(apiKeyInput);
                
                // Add form to document, submit it, then remove it
                document.body.appendChild(form);
                form.submit();
                
                // Monitor iframe load to detect completion
                iframe.onload = function() {
                    console.log('Form submission completed');
                    
                    // Update the button immediately after submission
                    if (action === 'Check Out') {
                        checkoutButton.textContent = 'Check In';
                        checkoutButton.className = 'checkin';
                    } else {
                        checkoutButton.textContent = 'Check Out';
                        checkoutButton.className = 'checkout';
                    }
                    
                    // Clean up
                    document.body.removeChild(form);
                    
                    // Force refresh the data source
                    refreshDataSources().then(() => {
                        // Then update the button state after data refresh
                        setTimeout(updateButton, 2000);
                        
                        // Show success message
                        alert(`${action} request submitted successfully!`);
                    });
                };
            };
            
            // Send the request
            xhr.send(JSON.stringify(payload));
            
        } catch (error) {
            console.error('Error details:', error);
            alert(`Error: ${error.message}`);
            
            // Reset button
            checkoutButton.textContent = originalText;
            checkoutButton.disabled = false;
        }
    });

    // Initial update
    updateButton();
    
    // Subscribe to all parameter changes and selection changes
    tableau.extensions.dashboardContent.dashboard.getParametersAsync().then(parameters => {
        parameters.forEach(parameter => {
            parameter.addEventListener(tableau.TableauEventType.ParameterChanged, () => {
                updateButton();
            });
        });
    });
    
    // Listen for mark selection changes
    worksheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged, () => {
        updateButton();
    });
    
    // Listen for filter changes
    worksheet.addEventListener(tableau.TableauEventType.FilterChanged, () => {
        updateButton();
    });
}

// Add this new function to refresh all data sources
async function refreshDataSources() {
    try {
        console.log('Refreshing data sources...');
        
        const dashboard = tableau.extensions.dashboardContent.dashboard;
        const dataSourceFetchPromises = [];
        
        // Get all data sources in the dashboard
        dashboard.worksheets.forEach(worksheet => {
            dataSourceFetchPromises.push(worksheet.getDataSourcesAsync());
        });
        
        // Wait for all data source fetches to complete
        const worksheetDataSources = await Promise.all(dataSourceFetchPromises);
        
        // Flatten the array of arrays
        const allDataSources = [].concat(...worksheetDataSources);
        
        // Create a Set to store unique data source IDs
        const uniqueDataSourceIds = new Set();
        const uniqueDataSources = [];
        
        // Filter out duplicate data sources
        allDataSources.forEach(dataSource => {
            if (!uniqueDataSourceIds.has(dataSource.id)) {
                uniqueDataSourceIds.add(dataSource.id);
                uniqueDataSources.push(dataSource);
            }
        });
        
        console.log(`Found ${uniqueDataSources.length} unique data sources to refresh`);
        
        // Refresh each data source
        const refreshPromises = uniqueDataSources.map(dataSource => {
            console.log(`Refreshing data source: ${dataSource.name}`);
            return dataSource.refreshAsync();
        });
        
        // Wait for all refreshes to complete
        await Promise.all(refreshPromises);
        console.log('All data sources refreshed successfully');
        
    } catch (error) {
        console.error('Error refreshing data sources:', error);
    }
}
