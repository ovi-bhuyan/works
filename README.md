# Full-Stack Portfolio Project

This project has been converted from a `localStorage`-based static site to a full-stack application with a Node.js/Express backend. This allows project data to be stored centrally on a server, making it accessible and consistent across all devices.

## Project Structure

```
/your-portfolio-project
|-- /public              # Contains all frontend files
|   |-- /uploads         # Stores uploaded images and documents
|   |-- admin.html
|   |-- admin.js
|   |-- index.html
|   |-- script.js
|   |-- style.css
|-- projects.json        # A simple file-based database
|-- server.js            # The backend Express server
|-- package.json         # Project dependencies and scripts
|-- README.md            # This instruction file
```

## Setup and Installation

### Prerequisites
You must have [Node.js](https://nodejs.org/) installed on your computer. This will also install `npm` (Node Package Manager).

### Steps:
1.  **Open a terminal** or command prompt in the root directory of your project (`your-portfolio-project`).

2.  **Install Dependencies:** Run the following command to install all the necessary packages defined in `package.json` (Express, Multer, etc.).
    ```bash
    npm install
    ```

3.  **Start the Server:** To run the server, use the following command. The `nodemon` package (installed as a dev dependency) will automatically restart the server whenever you save a change in `server.js`.
    ```bash
    npm run dev
    ```
    If you do not want auto-restarting, you can use:
    ```bash
    npm start
    ```
4.  **Access Your Application:**
    *   Your public portfolio is now available at: **http://localhost:3000**
    *   Your admin panel is at: **http://localhost:3000/admin.html**

The server is now running and your website is fully functional. All uploads will be saved to the server and will be visible from any device that can access this address.