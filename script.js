document.addEventListener('DOMContentLoaded', () => {
    // Initialize with configure context menu options
    tableau.extensions.initializeAsync({'configure': configure}).then(() => {
        const savedConfig = tableau.extensions.settings.get('checkoutConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            hideConfig();
            setupCheckoutListener(config);
        } else {
            showConfig();
        }
    });
});

function configure() {
    // Show configuration when the context menu option is clicked
    showConfig();
}

function showConfig() {
    const configSection = document.getElementById('configSection');
    configSection.classList.remove('hidden');
    
    // Populate worksheet dropdown
    const worksheetSelect = document.getElementById('worksheetSelect');
    worksheetSelect.innerHTML = '<option value="" disabled selected>Select Worksheet</option>';
    
    const dashboard = tableau.extensions.dashboardContent.dashboard;
    dashboard.worksheets.forEach(worksheet => {
        const option = document.createElement('option');
        option.value = worksheet.name;
        option.textContent = worksheet.name;
        worksheetSelect.appendChild(option);
    });

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
            
            // Status Column options
            const statusOption = document.createElement('option');
            statusOption.value = column;
            statusOption.textContent = column;
            statusColumn.appendChild(statusOption);
            
            // User Column options
            const userOption = document.createElement('option');
            userOption.value = column;
            userOption.textContent = column;
            userColumn.appendChild(userOption);
        });
        
        columnsSelect.style.display = 'block';
        
        // Handle save button click
        document.getElementById('saveConfig').addEventListener('click', () => {
            const currentUser = document.getElementById('currentUserField').value;
            
            if (!accountIdColumn.value || !statusColumn.value || !userColumn.value || !currentUser) {
                alert('Please select all required fields and enter your username');
                return;
            }
            
            const config = {
                worksheetName: worksheetSelect.value,
                accountIdColumn: accountIdColumn.value,
                statusColumn: statusColumn.value,
                userColumn: userColumn.value,
                currentUser: currentUser
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
            action: action
        };
        
        try {
            // Show pending state on button
            const originalText = checkoutButton.textContent;
            checkoutButton.textContent = 'Processing...';
            checkoutButton.disabled = true;
            
            console.log('Sending request with payload:', payload);
            
            // Use XMLHttpRequest instead of fetch for better cross-origin support
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://script.google.com/macros/s/AKfycbyXB8WBXK3TQ9oJi-x_NtxEssXl52uJK27JaW3hBPXXlFt5UH7QD3gOpr-lbnvxBZ68jQ/exec', true);
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
                form.action = 'https://script.google.com/macros/s/AKfycbyXB8WBXK3TQ9oJi-x_NtxEssXl52uJK27JaW3hBPXXlFt5UH7QD3gOpr-lbnvxBZ68jQ/exec';
                form.target = iframe.name; // Target the iframe instead of _blank
                form.style.display = 'none';
                
                // Add individual form fields instead of a single payload field
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
