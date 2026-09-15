# REVIVE 5.0

### Rural Healthcare Visibility Engine

REVIVE is a prototype rural healthcare platform designed to improve access to essential medical resources by providing real-time visibility of healthcare facilities, medicines, beds, blood availability, and patient referrals.

## Features

* Healthcare facility search
* Medicine availability tracking
* Hospital bed availability
* Blood resource information
* Smart patient referral management
* Pharmacy inventory management
* Bilingual interface support
* Device status and data synchronization
* User-friendly healthcare dashboard

## Tech Stack

* React
* TypeScript
* Vite
* Tailwind CSS
* Express.js
* Node.js
* Local mock database

## Getting Started

### Prerequisites

* Node.js 18 or later
* npm

### Installation

```bash
git clone https://github.com/your-username/revive.git
cd revive
npm install
```

### Run the Project

```bash
npm run dev
```

Open the application at:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev      # Start the development server
npm run build    # Build the application
npm start        # Start the production server
npm run preview  # Preview the frontend build
npm run lint     # Check TypeScript errors
```

## API Endpoints

| Method | Endpoint             | Description                    |
| ------ | -------------------- | ------------------------------ |
| GET    | `/api/health`        | Check server health            |
| GET    | `/api/facilities`    | Retrieve healthcare facilities |
| GET    | `/api/medicines`     | Retrieve medicine information  |
| GET    | `/api/beds`          | Retrieve bed availability      |
| GET    | `/api/device/status` | Check device status            |
| POST   | `/api/device/mode`   | Change device operating mode   |
| GET    | `/api/sync`          | Retrieve synchronized data     |
| POST   | `/api/sync/push`     | Upload pending data            |

## Project Status

REVIVE is currently a prototype using sample data for demonstration and development purposes. Real-time healthcare integration and hardware connectivity will be implemented in future versions.

## Future Enhancements

* Real-time healthcare data integration
* ESP32 hardware connectivity
* Secure user authentication
* Cloud database integration
* Emergency alerts
* Live hospital and pharmacy updates
* Deployment for rural healthcare communities

## Contributing

Contributions, suggestions, and improvements are welcome. Please create a new branch, make your changes, and submit a pull request.

## License

This project is currently intended for educational, prototype, and hackathon purposes.

## Acknowledgments

Developed as an innovative solution for improving rural healthcare accessibility and resource visibility.
