# Cricket Scorecard Calculator

A comprehensive web application for cricket scoring, match management, and tournament organization.

## Features

### Core Features
- **Match Setup**: Support for T20, ODI, Test, and Custom formats
- **Live Scoring**: Real-time score tracking with ball-by-ball updates
- **Player Management**: Complete team and player tracking
- **Scorecard Generation**: Detailed batting and bowling statistics
- **Match History**: Save and load previous matches
- **Awards System**: Automatic calculation of match awards

### Advanced Features
- **Tournament Mode**: Create and manage multi-team tournaments
- **Select Batter**: Choose opening batsmen and new batsmen after wickets
- **Change Batsman**: Ability to change batsmen before they face a ball
- **Name Editing**: Edit player names directly on the scorecard
- **Extras Tracking**: Comprehensive extras breakdown (wides, no-balls, byes, leg-byes)
- **Undo Functionality**: Undo last ball with complete state restoration
- **Share Scorecard**: Copy scorecard to clipboard for sharing

## Getting Started

1. Open `index.html` in a modern web browser
2. Fill in match details (teams, format, toss)
3. Add player names (optional)
4. Start the match and begin scoring

## Tournament Mode

1. Click "Tournament Mode" button on the main page
2. Navigate to `tournament.html`
3. Create a tournament with 4-10 teams
4. System automatically generates fixtures
5. Track points table and tournament statistics

## Navigation

- **Match Setup**: Initial match configuration
- **Live Scoring**: Ball-by-ball scoring interface
- **Scorecard**: View detailed match statistics
- **Match History**: Access saved matches
- **Start New Match**: Quick access to create a new match

## Testing

### Manual Testing
Open `regression_test_suite.html` for comprehensive manual test cases.

### Automated Testing
Open `execute_regression_tests.html` to run automated tests.

## Browser Support

- Chrome (recommended)
- Safari
- Firefox
- Edge

## Local Storage

The app uses browser's localStorage to:
- Auto-save active matches
- Store match history
- Preserve tournament data

## File Structure

```
cricket-scorecard/
├── index.html              # Main application
├── tournament.html         # Tournament mode
├── css/
│   ├── styles.css         # Main styles
│   └── tournament.css     # Tournament styles
├── js/
│   ├── cricket.js         # Core match logic
│   └── tournament.js      # Tournament logic
└── regression tests/      # Test files
```

## Recent Updates

- Added "Select Batter" button for controlled batsman selection
- Implemented change batsman feature with ↻ button
- Added name editing capability on scorecards
- New "Start New Match" button in header navigation
- Fixed non-striker selection issue
- Enhanced user experience with better controls

## License

This project is open source and available for personal and educational use.

## Author

Created as part of a hackathon project for comprehensive cricket scoring needs.