// Configure your API key here
const API_KEY = 'YOUR_SECRET_API_KEY';

function doPost(e) {
    try {
      // Log request details for debugging
      console.log("doPost received request:", JSON.stringify(e));
      
      let accountId, user, action, apiKey;
      
      // Handle both JSON and form data submissions
      if (e.postData && e.postData.type === "application/json") {
        // Handle JSON data
        console.log("Processing JSON data");
        const data = JSON.parse(e.postData.contents);
        accountId = data.accountId;
        user = data.user;
        action = data.action;
        apiKey = data.apiKey;
      } else if (e.parameter && e.parameter.payload) {
        // Handle form data with JSON payload
        console.log("Processing form data with JSON payload");
        const data = JSON.parse(e.parameter.payload);
        accountId = data.accountId;
        user = data.user;
        action = data.action;
        apiKey = data.apiKey;
      } else if (e.parameter) {
        // Handle regular form fields
        console.log("Processing form fields directly");
        accountId = e.parameter.accountId;
        user = e.parameter.user;
        action = e.parameter.action;
        apiKey = e.parameter.apiKey;
      } else {
        console.log("No data received in request");
        return createCORSResponse("No data received", 400);
      }
  
      console.log(`Data extracted: accountId=${accountId}, user=${user}, action=${action}, apiKey=***`);
      
      // Validate API key
      if (!apiKey || apiKey !== API_KEY) {
        console.log("Invalid or missing API key");
        return createCORSResponse("Unauthorized: Invalid API key", 401);
      }
      
      // Open the spreadsheet and the "ActivityLog" sheet
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Activity Log");
      if (!sheet) {
        console.log("Sheet 'Activity Log' not found");
        return createCORSResponse("Sheet 'Activity Log' not found", 404);
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
      return createCORSResponse("Logged successfully", 200);
  
    } catch (err) {
      console.log("Error in doPost:", err.message);
      return createCORSResponse("Error: " + err.message, 500);
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

function createCORSResponse(message, statusCode) {
  return ContentService.createTextOutput(message)
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('X-Status-Code', statusCode || 200);
}

// Handle OPTIONS requests for CORS preflight
function doOptions(e) {
  console.log("doOptions received request:", JSON.stringify(e));
  
  return createCORSResponse("Options request handled", 200);
}
  