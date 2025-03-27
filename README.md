# Tableau Account Checkout Extension

A secure Tableau extension that allows users to check in/out accounts or resources directly from a Tableau dashboard.

## Features

- Check out/in resources with a simple button click
- Automatically detects current user from Tableau login
- Stores activity log in a Google Spreadsheet
- Secured with API key authentication
- Refreshes data sources after actions
- Responsive UI with clear status indicators

## Setup Instructions

### Google Apps Script Setup

1. Create a new Google Spreadsheet with a sheet named "Activity Log"
2. Go to Extensions > Apps Script
3. Replace the default code with the contents of `appscript.js` from this repo
4. Change the `API_KEY` constant to a secure random string of your choosing:
   ```javascript
   const API_KEY = 'YOUR_SECRET_API_KEY'; // Replace with a secure random string
   ```
5. Deploy your script as a web app:
   - Click Deploy > New deployment
   - Set "Execute as" to "Me"
   - Set "Who has access" to "Anyone"
   - Click Deploy
   - Copy the Web App URL for later

### Tableau Extension Setup

1. Place the extension files (index.html, script.js, checkout.trex) on a web server
2. Open your Tableau dashboard
3. Go to Dashboard > Extensions > Add Extension
4. Select the .trex file from your computer
5. Configure the extension:
   - Select the worksheet containing your account data
   - Choose the appropriate columns for Account ID, Status, and User
   - Enter the Google Apps Script Web App URL
   - Enter your API key (must match the one in your Apps Script)
   - Click Save Configuration

## Data Requirements

Your Tableau worksheet should contain at least these columns:
- Account ID: A unique identifier for the resource
- Status: The current status (e.g., "Check In" or "Check Out")
- User: Who has the resource checked out (or "Available")

## How It Works

1. When a user views the dashboard, they see a button with one of three states:
   - "Check Out" (if the resource is available)
   - "Check In" (if the user has the resource checked out)
   - "Currently Checked out by [name]" (if someone else has it checked out)

2. When the button is clicked, the extension:
   - Sends a secured POST request to your Google Apps Script
   - Records the action in the Activity Log spreadsheet
   - Refreshes Tableau data sources
   - Updates the button state

## Security Features

- API key validation ensures only authorized extensions can access your Google Script
- User identity is automatically detected from Tableau credentials
- API key is never exposed in client-side code
- CORS protection on the server side

## Customization

You can modify the UI appearance by editing the CSS in `index.html`.

## Troubleshooting

- If the extension shows "Configuration Error", check that your API key and Google Script URL are correctly entered
- View the browser console (F12) for detailed error messages
- Check the Google Apps Script execution logs for server-side errors

## License

MIT License 