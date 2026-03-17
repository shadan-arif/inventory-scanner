# Inventory Scanner

A Next.js application designed to scan barcodes and manage inventory items locally by interfacing with the Catapult POS system API.

## API Routes

This project includes several custom API routes located under the `src/app/api` directory. These routes act as an intermediate proxy to communicate with the external Catapult API safely.

### 1. `GET /api/getItem`
- **Description:** Retrieves information about a specific item.
- **How it works:** Expects an `itemId` query parameter. It uses the `CATAPULT_API_BASE` and `CATAPULT_API_KEY` environment variables to make a GET request to the Catapult POS `/api/itemLookup` endpoint. It returns the selected item data as JSON.

### 2. `POST /api/updateItem`
- **Description:** Updates the maintenance data of an item.
- **How it works:** Accepts a JSON payload in the request body. It securely forwards this data to Catapult's `/api/batch/itemMaintenance` endpoint using environment variables (`CATAPULT_API_BASE` and `CATAPULT_API_KEY`) for authentication.

### 3. `POST /api/updateName`
- **Description:** Specifically updates an item's name/description on the POS system.
- **How it works:** Accepts a JSON payload. Unlike `updateItem`, this route allows overriding the default configuration via headers (`x-base-url`, `x-api-key`, `x-params`), with hardcoded fallbacks if the headers are not provided. It sends the update directly to `/api/batch/itemMaintenance`.

### 4. `POST /api/updatePrice`
- **Description:** Updates the pricing information for a specific item.
- **How it works:** Similar to `updateName`, it accepts a JSON body and allows overriding credentials and base URL using custom headers (`x-base-url`, `x-api-key`, `x-params`). It communicates with the Catapult `/api/batch/itemPricing` endpoint to apply the price change.

## Prerequisites (Windows)

Before running the project on your Windows machine, ensure you have the following installed:

1. **Node.js**: Download and install the LTS (Long Term Support) version from the [official Node.js website](https://nodejs.org/). This will also install `npm` (Node Package Manager).
   - *To verify installation, open CMD and run:* `node -v` and `npm -v`
2. **Git** (Optional but recommended): If you need to clone the repository using the command line.
3. **Catapult Credentials**: You will need the appropriate `CATAPULT_API_BASE` and `CATAPULT_API_KEY` values to communicate with your POS system.

## Local Installation Guide (Windows CMD)

Follow these steps to get the project running locally on your Windows machine using the Command Prompt (cmd):

1. **Open Command Prompt:**
   Press the `Windows key`, type `cmd`, and hit `Enter`.

2. **Navigate to the Project Directory:**
   You need to tell the Command Prompt where your project is located using the `cd` (change directory) command. 
   
   **The easiest way to do this in Windows:**
   - Open File Explorer and find the `inventory-scanner` folder.
   - Click once in the address bar at the top of the File Explorer window. It will highlight the folder path (e.g., `C:\Users\YourName\Downloads\inventory-scanner`).
   - Copy this path (`Ctrl + C`).
   - Go back to your Command Prompt, type `cd ` (make sure to include the space), and then paste the path (`Ctrl + V` or Right-click). Let's assume you saved it in your Documents folder:
   ```cmd
   cd C:\Users\YourName\Documents\inventory-scanner
   ```
   Hit `Enter`. If your command prompt path changes to that folder, you are good to go!
   
   *(Note: If your project is on a different drive, like the `D:` drive, you will first need to type `D:` and press `Enter` in the command prompt before using the `cd` command).*

3. **Install Dependencies:**
   Run the following command to download all required packages:
   ```cmd
   npm install
   ```

4. **Set Up Environment Variables:**
   Create a new file named `.env.local` in the root directory of the project. You can do this via CMD:
   ```cmd
   type nul > .env.local
   ```
   Open the `.env.local` file in any text editor (like Notepad) and add your Catapult configuration:
   ```env
   CATAPULT_API_BASE="https://your-catapult-base-url.com"
   CATAPULT_API_KEY="YOUR_API_KEY_HERE"
   ```

5. **Start the Development Server:**
   Once the dependencies are installed and the environment file is ready, start the application:
   ```cmd
   npm run dev
   ```

6. **Access the Application:**
   Open your preferred web browser and navigate to:
   ```
   http://localhost:3000
   ```
   You can now start using the inventory scanner application locally on your machine!

## How to Run the Program Again

If you have closed the Command Prompt or restarted your computer, you will need to start the server again before you can use the application.

1. **Open Command Prompt:**
   Press the `Windows key`, type `cmd`, and hit `Enter`.
2. **Navigate to the Project Directory:**
   Just like during installation, use the `cd` command to go to your project folder. (Remember, you can copy the path from File Explorer's address bar):
   ```cmd
   cd C:\Users\YourName\Documents\inventory-scanner
   ```
3. **Start the Server:**
   ```cmd
   npm run dev
   ```
4. **Keep it Open:** As long as that Command Prompt window remains open and the command is running, the application will be accessible at `http://localhost:3000`.

## Keeping the Server Running Continuously (Background)

If you don't want to keep a Command Prompt window open all the time, you can use a process manager like **PM2** to run the Next.js application in the background continuously.

### 1. Install PM2
Open Command Prompt (you might need to run it as Administrator) and install PM2 globally:
```cmd
npm install -g pm2
```

### 2. Build the Application
Before running an app continuously in the background, it is recommended to build the production version. In your project directory, run:
```cmd
npm run build
```

### 3. Start the Server with PM2
Once the build completes, start the application using PM2:
```cmd
pm2 start npm --name "inventory-scanner" -- start
```
The server is now running in the background! You can safely close the Command Prompt, and your scanner will still be available at `http://localhost:3000`.

### Helpful PM2 Commands
To manage your application in the background, you can use these commands in any directory:
- **List running apps:** `pm2 list`
- **Stop the server:** `pm2 stop inventory-scanner`
- **Start a stopped server:** `pm2 start inventory-scanner`
- **Restart the server:** `pm2 restart inventory-scanner`
- **View server logs:** `pm2 logs inventory-scanner`

### Optional: Start Automatically on System Boot
If you want the server to automatically start whenever you restart your Windows machine, you can use the `pm2-windows-startup` utility:
```cmd
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```
This will configure your Windows system to resurrect PM2 and your inventory scanner on boot.
