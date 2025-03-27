function doPost(e) {
    try {
      // Log request details for debugging
      console.log("doPost received request:", JSON.stringify(e));
      
      let accountId, user, action;
      
      // Handle both JSON and form data submissions
      if (e.postData && e.postData.type === "application/json") {
        // Handle JSON data
        console.log("Processing JSON data");
        const data = JSON.parse(e.postData.contents);
        accountId = data.accountId;
        user = data.user;
        action = data.action;
      } else if (e.parameter && e.parameter.payload) {
        // Handle form data with JSON payload
        console.log("Processing form data with JSON payload");
        const data = JSON.parse(e.parameter.payload);
        accountId = data.accountId;
        user = data.user;
        action = data.action;
      } else if (e.parameter) {
        // Handle regular form fields
        console.log("Processing form fields directly");
        accountId = e.parameter.accountId;
        user = e.parameter.user;
        action = e.parameter.action;
      } else {
        console.log("No data received in request");
        return createCORSResponse("No data received");
      }
  
      console.log(`Data extracted: accountId=${accountId}, user=${user}, action=${action}`);
      
      // Open the spreadsheet and the "ActivityLog" sheet
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Activity Log");
      if (!sheet) {
        console.log("Sheet 'Activity Log' not found");
        return createCORSResponse("Sheet 'Activity Log' not found");
      }
  
      // Get current datetime
      const now = new Date();
  
      // Prepare the new row data
      const newRow = [now, accountId, user, action];
  
      // Insert the new row at position 2
      sheet.insertRowBefore(2);
      sheet.getRange(2, 1, 1, 4).setValues([newRow]);
      
      console.log("Data successfully logged to spreadsheet");
  
      // Return a success response
      return createCORSResponse("Logged successfully");
  
    } catch (err) {
      console.log("Error in doPost:", err.message);
      return createCORSResponse("Error: " + err.message);
    }
}

function doGet(e) {
  console.log("doGet received request:", JSON.stringify(e));
  
  // Handle GET requests by returning a simple HTML response
  const htmlOutput = HtmlService.createHtmlOutput(
    '<html><body>' +
    '<h2>Account Checkout System</h2>' +
    '<p>Action processed successfully.</p>' +
    '<p>You can close this window now.</p>' +
    '<script>setTimeout(function() { window.close(); }, 3000);</script>' +
    '</body></html>'
  );
  
  return htmlOutput;
}

function createCORSResponse(message) {
  return ContentService.createTextOutput(message)
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Handle OPTIONS requests for CORS preflight
function doOptions(e) {
  console.log("doOptions received request:", JSON.stringify(e));
  
  return createCORSResponse("Options request handled");
}
  