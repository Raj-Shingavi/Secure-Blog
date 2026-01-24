# SecureBlog - Authentic Content Platform

SecureBlog is a secure, verifiable blogging platform designed to promote authentic content. It features a robust backend built with FastAPI and a dynamic frontend using React (via CDN), offering a seamless user experience.

## Features

- **User Authentication**: Secure registration and login with JWT-based authentication.
- **Content Integrity**:
  - **Plagiarism Detection**: Analyzes content against existing articles to prevent duplicates.
  - **AI Probability Estimation**: Estimates the likelihood of content being AI-generated.
- **Version History**: Tracks changes to blog posts with version control and change descriptions.
- **Modern UI**: A premium, responsive design with dark mode elements and smooth interactions.
- **Role-Based Access**: Authors can manage their own content securely.

## Tech Stack

### Backend
- **FastAPI**: High-performance web framework for building APIs.
- **MySQL**: Relational database for data persistence.
- **Python-Jose**: For JSON Web Token (JWT) handling.
- **Scikit-learn & Numpy**: Used for content analysis and scoring.

### Frontend
- **React**: Library for building user interfaces (served via CDN).
- **React Router**: For client-side routing.
- **Babel**: For in-browser JSX transformation.

## Prerequisites

- **Python 3.8+**
- **MySQL Server**

## Installation

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd BLOG
    ```

2.  **Backend Setup**
    Navigate to the backend directory and install dependencies:
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

3.  **Database Configuration**
    Ensure your MySQL server is running. You can configure the connection using environment variables or modify defaults in `backend/db_utils.py`.

    **Default Configuration:**
    - Host: `localhost`
    - User: `root`
    - Password: (empty)
    - Database: `secure_blog_db`

    To override, set the following environment variables:
    ```bash
    export DB_HOST="your_host"
    export DB_USER="your_user"
    export DB_PASSWORD="your_password"
    export DB_NAME="your_db_name"
    ```

## Usage

1.  **Start the Application**
    From the `backend` directory, run the FastAPI server:
    ```bash
    python main.py
    ```

2.  **Access the App**
    Open your browser and navigate to:
    ```
    http://localhost:8000
    ```
    The frontend is served directly by the FastAPI backend.
