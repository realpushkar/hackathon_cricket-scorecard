class TournamentManager {
    constructor() {
        this.tournament = {
            id: null,
            name: '',
            format: '', // 'league', 'knockout', 'mixed'
            startDate: '',
            endDate: '',
            teams: [],
            matches: [],
            pointsTable: [],
            currentStage: 'group', // 'group', 'playoffs', 'final'
            settings: {
                pointsForWin: 2,
                pointsForTie: 1,
                pointsForLoss: 0,
                pointsForNoResult: 1,
                qualifyingTeams: 4,
                matchFormat: 'T20'
            },
            stats: {
                totalMatches: 0,
                completedMatches: 0,
                upcomingMatches: 0,
                topScorer: null,
                topWicketTaker: null,
                highestTeamScore: null,
                lowestTeamScore: null
            }
        };
        
        this.initializeTournamentListeners();
    }
    
    initializeTournamentListeners() {
        // Tournament setup form
        const tournamentForm = document.getElementById('tournamentSetupForm');
        if (tournamentForm) {
            tournamentForm.addEventListener('submit', (e) => this.createTournament(e));
        }
        
        // Format change handler
        const formatSelect = document.getElementById('tournamentFormat');
        if (formatSelect) {
            formatSelect.addEventListener('change', (e) => this.handleFormatChange(e));
        }
        
        // Add team button
        const addTeamBtn = document.getElementById('addTeamBtn');
        if (addTeamBtn) {
            addTeamBtn.addEventListener('click', () => this.addTeamInput());
        }
    }
    
    createTournament(e) {
        e.preventDefault();
        
        // Get tournament details
        this.tournament.id = Date.now();
        this.tournament.name = document.getElementById('tournamentName').value;
        this.tournament.format = document.getElementById('tournamentFormat').value;
        this.tournament.startDate = document.getElementById('startDate').value;
        this.tournament.endDate = document.getElementById('endDate').value;
        
        // Validate dates
        if (new Date(this.tournament.startDate) > new Date(this.tournament.endDate)) {
            alert('End date must be after start date');
            return;
        }
        
        // Validate date range is reasonable (max 3 months)
        const daysDiff = Math.ceil((new Date(this.tournament.endDate) - new Date(this.tournament.startDate)) / (1000 * 60 * 60 * 24));
        if (daysDiff > 90) {
            if (!confirm('Tournament spans more than 90 days. Continue?')) {
                return;
            }
        }
        
        // Get teams
        const teamInputs = document.querySelectorAll('.team-input');
        const teamNames = Array.from(teamInputs)
            .map(input => input.value.trim())
            .filter(name => name.length > 0);
        
        // Check for duplicate team names
        const uniqueTeams = new Set(teamNames);
        if (uniqueTeams.size !== teamNames.length) {
            alert('Duplicate team names found. Please ensure all team names are unique.');
            return;
        }
        
        // Create team objects
        this.tournament.teams = teamNames.map((name, index) => ({
            id: index + 1,
            name: name,
            played: 0,
            won: 0,
            lost: 0,
            tied: 0,
            noResult: 0,
            points: 0,
            runRate: 0,
            totalRunsScored: 0,
            totalOversPlayed: 0,
            totalRunsConceded: 0,
            totalOversBowled: 0,
            form: [] // Last 5 match results
        }));
        
        // Validate minimum teams
        if (this.tournament.teams.length < this.getMinimumTeams()) {
            alert(`Minimum ${this.getMinimumTeams()} teams required for ${this.tournament.format} format`);
            return;
        }
        
        // Generate fixtures
        this.generateFixtures();
        
        // Initialize points table
        this.initializePointsTable();
        
        // Save tournament
        this.saveTournament();
        
        // Show tournament dashboard
        this.showTournamentDashboard();
    }
    
    getMinimumTeams() {
        switch(this.tournament.format) {
            case 'knockout': return 2;
            case 'league': return 3;
            case 'mixed': return 4;
            default: return 4;
        }
    }
    
    generateFixtures() {
        this.tournament.matches = [];
        let matchId = 1;
        
        switch(this.tournament.format) {
            case 'league':
                // Round-robin: each team plays every other team once
                for (let i = 0; i < this.tournament.teams.length; i++) {
                    for (let j = i + 1; j < this.tournament.teams.length; j++) {
                        this.tournament.matches.push({
                            id: matchId++,
                            team1: this.tournament.teams[i].name,
                            team2: this.tournament.teams[j].name,
                            stage: 'group',
                            status: 'scheduled',
                            date: this.calculateMatchDate(matchId - 1),
                            venue: `Venue ${((matchId - 1) % 3) + 1}`,
                            result: null,
                            scorecard: null
                        });
                    }
                }
                break;
                
            case 'knockout':
                // Single elimination tournament
                this.generateKnockoutFixtures(this.tournament.teams, 'quarterfinal');
                break;
                
            case 'mixed':
                // Group stage + knockouts
                const groupSize = Math.floor(this.tournament.teams.length / 2);
                const groupA = this.tournament.teams.slice(0, groupSize);
                const groupB = this.tournament.teams.slice(groupSize);
                
                // Group A matches
                for (let i = 0; i < groupA.length; i++) {
                    for (let j = i + 1; j < groupA.length; j++) {
                        this.tournament.matches.push({
                            id: matchId++,
                            team1: groupA[i].name,
                            team2: groupA[j].name,
                            stage: 'groupA',
                            status: 'scheduled',
                            date: this.calculateMatchDate(matchId - 1),
                            venue: `Venue ${((matchId - 1) % 3) + 1}`,
                            result: null,
                            scorecard: null
                        });
                    }
                }
                
                // Group B matches
                for (let i = 0; i < groupB.length; i++) {
                    for (let j = i + 1; j < groupB.length; j++) {
                        this.tournament.matches.push({
                            id: matchId++,
                            team1: groupB[i].name,
                            team2: groupB[j].name,
                            stage: 'groupB',
                            status: 'scheduled',
                            date: this.calculateMatchDate(matchId - 1),
                            venue: `Venue ${((matchId - 1) % 3) + 1}`,
                            result: null,
                            scorecard: null
                        });
                    }
                }
                break;
        }
        
        this.tournament.stats.totalMatches = this.tournament.matches.length;
        this.tournament.stats.upcomingMatches = this.tournament.matches.length;
    }
    
    generateKnockoutFixtures(teams, stage) {
        let matchId = this.tournament.matches.length + 1;
        const matches = [];
        
        // Pair teams for current round
        for (let i = 0; i < teams.length; i += 2) {
            if (i + 1 < teams.length) {
                matches.push({
                    id: matchId++,
                    team1: teams[i].name || teams[i],
                    team2: teams[i + 1].name || teams[i + 1],
                    stage: stage,
                    status: 'scheduled',
                    date: this.calculateMatchDate(matchId - 1),
                    venue: `Venue ${((matchId - 1) % 3) + 1}`,
                    result: null,
                    scorecard: null,
                    nextMatch: null
                });
            }
        }
        
        this.tournament.matches.push(...matches);
        
        // Generate next round if needed
        if (matches.length > 1) {
            const nextStage = this.getNextKnockoutStage(stage);
            const placeholders = matches.map(m => `Winner of Match ${m.id}`);
            this.generateKnockoutFixtures(placeholders, nextStage);
        }
    }
    
    getNextKnockoutStage(currentStage) {
        const stages = ['quarterfinal', 'semifinal', 'final'];
        const currentIndex = stages.indexOf(currentStage);
        return stages[Math.min(currentIndex + 1, stages.length - 1)];
    }
    
    calculateMatchDate(matchIndex) {
        const start = new Date(this.tournament.startDate);
        const daysToAdd = Math.floor(matchIndex / 2); // 2 matches per day
        start.setDate(start.getDate() + daysToAdd);
        return start.toISOString().split('T')[0];
    }
    
    initializePointsTable() {
        this.tournament.pointsTable = this.tournament.teams.map(team => ({
            ...team,
            netRunRate: 0
        }));
    }
    
    updatePointsTable(match, result) {
        const team1 = this.tournament.pointsTable.find(t => t.name === match.team1);
        const team2 = this.tournament.pointsTable.find(t => t.name === match.team2);
        
        if (!team1 || !team2) return;
        
        // Update matches played
        team1.played++;
        team2.played++;
        
        // Update results and points
        if (result.winner === 'tie') {
            team1.tied++;
            team2.tied++;
            team1.points += this.tournament.settings.pointsForTie;
            team2.points += this.tournament.settings.pointsForTie;
            team1.form.push('T');
            team2.form.push('T');
        } else if (result.winner === 'no result') {
            team1.noResult++;
            team2.noResult++;
            team1.points += this.tournament.settings.pointsForNoResult;
            team2.points += this.tournament.settings.pointsForNoResult;
            team1.form.push('N');
            team2.form.push('N');
        } else {
            const winningTeam = result.winner === match.team1 ? team1 : team2;
            const losingTeam = result.winner === match.team1 ? team2 : team1;
            
            winningTeam.won++;
            winningTeam.points += this.tournament.settings.pointsForWin;
            winningTeam.form.push('W');
            
            losingTeam.lost++;
            losingTeam.points += this.tournament.settings.pointsForLoss;
            losingTeam.form.push('L');
        }
        
        // Keep only last 5 matches in form
        team1.form = team1.form.slice(-5);
        team2.form = team2.form.slice(-5);
        
        // Update run rates
        this.updateRunRates(team1, team2, result);
        
        // Sort points table
        this.sortPointsTable();
    }
    
    updateRunRates(team1, team2, result) {
        // Update runs scored and overs played
        if (result.team1Score) {
            team1.totalRunsScored += result.team1Score.runs;
            team1.totalOversPlayed += result.team1Score.overs + (result.team1Score.balls / 6);
            team2.totalRunsConceded += result.team1Score.runs;
            team2.totalOversBowled += result.team1Score.overs + (result.team1Score.balls / 6);
        }
        
        if (result.team2Score) {
            team2.totalRunsScored += result.team2Score.runs;
            team2.totalOversPlayed += result.team2Score.overs + (result.team2Score.balls / 6);
            team1.totalRunsConceded += result.team2Score.runs;
            team1.totalOversBowled += result.team2Score.overs + (result.team2Score.balls / 6);
        }
        
        // Calculate net run rate
        team1.netRunRate = this.calculateNetRunRate(team1);
        team2.netRunRate = this.calculateNetRunRate(team2);
    }
    
    calculateNetRunRate(team) {
        const runsPerOver = team.totalOversPlayed > 0 ? 
            team.totalRunsScored / team.totalOversPlayed : 0;
        const runsConcededPerOver = team.totalOversBowled > 0 ? 
            team.totalRunsConceded / team.totalOversBowled : 0;
        return (runsPerOver - runsConcededPerOver).toFixed(3);
    }
    
    sortPointsTable() {
        this.tournament.pointsTable.sort((a, b) => {
            // Sort by points
            if (b.points !== a.points) return b.points - a.points;
            // Then by net run rate
            if (b.netRunRate !== a.netRunRate) return b.netRunRate - a.netRunRate;
            // Then by wins
            if (b.won !== a.won) return b.won - a.won;
            // Then by head-to-head (if implemented)
            return 0;
        });
    }
    
    matchCompleted(matchId, matchData) {
        const match = this.tournament.matches.find(m => m.id === matchId);
        if (!match) return;
        
        match.status = 'completed';
        match.result = {
            winner: matchData.winner,
            margin: matchData.result,
            team1Score: {
                runs: matchData.team1.runs,
                wickets: matchData.team1.wickets,
                overs: matchData.team1.overs,
                balls: matchData.team1.balls
            },
            team2Score: {
                runs: matchData.team2.runs,
                wickets: matchData.team2.wickets,
                overs: matchData.team2.overs,
                balls: matchData.team2.balls
            }
        };
        match.scorecard = matchData;
        
        // Extract match awards
        match.awards = {
            manOfTheMatch: this.extractManOfTheMatch(matchData),
            bestBatter: this.extractBestBatter(matchData),
            bestBowler: this.extractBestBowler(matchData)
        };
        
        // Update points table
        this.updatePointsTable(match, match.result);
        
        // Update tournament stats
        this.updateTournamentStats(matchData);
        
        // Check if stage is complete
        this.checkStageCompletion();
        
        // Save tournament
        this.saveTournament();
    }
    
    updateTournamentStats(matchData) {
        this.tournament.stats.completedMatches++;
        this.tournament.stats.upcomingMatches--;
        
        // Update top scorer
        const allBatsmen = [...matchData.team1.batting, ...matchData.team2.batting];
        allBatsmen.forEach(batsman => {
            if (!this.tournament.stats.topScorer || 
                batsman.runs > this.tournament.stats.topScorer.runs) {
                this.tournament.stats.topScorer = {
                    name: batsman.name,
                    runs: batsman.runs,
                    team: batsman.team
                };
            }
        });
        
        // Update top wicket taker
        const allBowlers = [...matchData.team1.bowling, ...matchData.team2.bowling];
        allBowlers.forEach(bowler => {
            if (!this.tournament.stats.topWicketTaker || 
                bowler.wickets > this.tournament.stats.topWicketTaker.wickets) {
                this.tournament.stats.topWicketTaker = {
                    name: bowler.name,
                    wickets: bowler.wickets,
                    team: bowler.team
                };
            }
        });
        
        // Update highest/lowest team scores
        const team1Total = matchData.team1.runs;
        const team2Total = matchData.team2.runs;
        
        if (!this.tournament.stats.highestTeamScore || 
            team1Total > this.tournament.stats.highestTeamScore.runs) {
            this.tournament.stats.highestTeamScore = {
                team: matchData.team1.name,
                runs: team1Total,
                wickets: matchData.team1.wickets,
                overs: matchData.team1.overs
            };
        }
        
        if (!this.tournament.stats.highestTeamScore || 
            team2Total > this.tournament.stats.highestTeamScore.runs) {
            this.tournament.stats.highestTeamScore = {
                team: matchData.team2.name,
                runs: team2Total,
                wickets: matchData.team2.wickets,
                overs: matchData.team2.overs
            };
        }
    }
    
    checkStageCompletion() {
        if (this.tournament.format === 'league') {
            const allGroupMatches = this.tournament.matches.filter(m => m.stage === 'group');
            const completedGroupMatches = allGroupMatches.filter(m => m.status === 'completed');
            
            if (completedGroupMatches.length === allGroupMatches.length) {
                // All group matches completed, generate playoffs if needed
                this.generatePlayoffs();
            }
        } else if (this.tournament.format === 'mixed') {
            const groupAMatches = this.tournament.matches.filter(m => m.stage === 'groupA');
            const groupBMatches = this.tournament.matches.filter(m => m.stage === 'groupB');
            const completedA = groupAMatches.filter(m => m.status === 'completed');
            const completedB = groupBMatches.filter(m => m.status === 'completed');
            
            if (completedA.length === groupAMatches.length && 
                completedB.length === groupBMatches.length) {
                // Both groups completed, generate knockouts
                this.generatePlayoffs();
            }
        }
    }
    
    generatePlayoffs() {
        if (this.tournament.currentStage !== 'group') return;
        
        this.tournament.currentStage = 'playoffs';
        
        // Get top teams
        const qualifiers = this.tournament.pointsTable
            .slice(0, this.tournament.settings.qualifyingTeams);
        
        // Generate playoff matches based on format
        if (this.tournament.settings.qualifyingTeams === 4) {
            // IPL style playoffs
            let matchId = this.tournament.matches.length + 1;
            
            // Qualifier 1: 1st vs 2nd
            this.tournament.matches.push({
                id: matchId++,
                team1: qualifiers[0].name,
                team2: qualifiers[1].name,
                stage: 'qualifier1',
                status: 'scheduled',
                date: this.calculateMatchDate(matchId - 1),
                venue: 'Playoff Venue 1',
                result: null,
                scorecard: null
            });
            
            // Eliminator: 3rd vs 4th
            this.tournament.matches.push({
                id: matchId++,
                team1: qualifiers[2].name,
                team2: qualifiers[3].name,
                stage: 'eliminator',
                status: 'scheduled',
                date: this.calculateMatchDate(matchId - 1),
                venue: 'Playoff Venue 2',
                result: null,
                scorecard: null
            });
            
            // Qualifier 2 and Final will be generated after results
        }
    }
    
    showTournamentDashboard() {
        document.getElementById('tournamentSetup').style.display = 'none';
        document.getElementById('tournamentDashboard').style.display = 'block';
        this.updateDashboard();
        
        // Update teams display
        this.displayTeams();
    }
    
    updateDashboard() {
        // Update tournament info
        document.getElementById('tournamentTitle').textContent = this.tournament.name;
        document.getElementById('tournamentDates').textContent = 
            `${this.tournament.startDate} to ${this.tournament.endDate}`;
        
        // Update stats
        document.getElementById('totalMatches').textContent = this.tournament.stats.totalMatches;
        document.getElementById('completedMatches').textContent = this.tournament.stats.completedMatches;
        document.getElementById('upcomingMatches').textContent = this.tournament.stats.upcomingMatches;
        
        // Update points table
        this.displayPointsTable();
        
        // Update fixtures
        this.displayFixtures();
        
        // Update tournament stats
        this.displayTournamentStats();
    }
    
    displayPointsTable() {
        const tableBody = document.getElementById('pointsTableBody');
        if (!tableBody) return;
        
        let html = '';
        this.tournament.pointsTable.forEach((team, index) => {
            html += `
                <tr class="${index < this.tournament.settings.qualifyingTeams ? 'qualifying-position' : ''}">
                    <td>${index + 1}</td>
                    <td>${team.name}</td>
                    <td>${team.played}</td>
                    <td>${team.won}</td>
                    <td>${team.lost}</td>
                    <td>${team.tied}</td>
                    <td>${team.noResult}</td>
                    <td><strong>${team.points}</strong></td>
                    <td>${team.netRunRate > 0 ? '+' : ''}${team.netRunRate}</td>
                    <td>${team.form.join(' ')}</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    }
    
    displayFixtures() {
        const fixturesDiv = document.getElementById('fixturesList');
        if (!fixturesDiv) return;
        
        let html = '<div class="fixtures-grid">';
        
        // Group by date
        const matchesByDate = {};
        this.tournament.matches.forEach(match => {
            if (!matchesByDate[match.date]) {
                matchesByDate[match.date] = [];
            }
            matchesByDate[match.date].push(match);
        });
        
        // Display matches by date
        Object.keys(matchesByDate).sort().forEach(date => {
            html += `<div class="fixture-date">
                <h4>${new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</h4>`;
            
            matchesByDate[date].forEach(match => {
                const statusClass = match.status === 'completed' ? 'completed' : 
                                   match.status === 'live' ? 'live' : 'scheduled';
                
                html += `
                    <div class="fixture-card ${statusClass}" data-match-id="${match.id}">
                        <div class="fixture-teams">
                            <div class="team1">${match.team1}</div>
                            <div class="vs">vs</div>
                            <div class="team2">${match.team2}</div>
                        </div>
                        <div class="fixture-info">
                            <span class="venue">${match.venue}</span>
                            <span class="stage">${match.stage.toUpperCase()}</span>
                        </div>
                `;
                
                if (match.status === 'completed' && match.result) {
                    html += `
                        <div class="fixture-result">
                            <div class="scores">
                                ${match.team1}: ${match.result.team1Score.runs}/${match.result.team1Score.wickets} 
                                (${match.result.team1Score.overs}.${match.result.team1Score.balls})
                            </div>
                            <div class="scores">
                                ${match.team2}: ${match.result.team2Score.runs}/${match.result.team2Score.wickets} 
                                (${match.result.team2Score.overs}.${match.result.team2Score.balls})
                            </div>
                            <div class="result">${match.result.margin}</div>
                        </div>
                    `;
                    
                    // Display match awards if available
                    if (match.awards) {
                        html += '<div class="match-awards">';
                        
                        if (match.awards.manOfTheMatch) {
                            html += `
                                <div class="award-item">
                                    <span class="award-icon">🏆</span>
                                    <span class="award-title">Man of the Match:</span>
                                    <span class="award-winner">${match.awards.manOfTheMatch.name}</span>
                                </div>
                            `;
                        }
                        
                        if (match.awards.bestBatter) {
                            html += `
                                <div class="award-item">
                                    <span class="award-icon">🏏</span>
                                    <span class="award-title">Best Batter:</span>
                                    <span class="award-winner">${match.awards.bestBatter.name} (${match.awards.bestBatter.runs} runs)</span>
                                </div>
                            `;
                        }
                        
                        if (match.awards.bestBowler) {
                            html += `
                                <div class="award-item">
                                    <span class="award-icon">🎾</span>
                                    <span class="award-title">Best Bowler:</span>
                                    <span class="award-winner">${match.awards.bestBowler.name} (${match.awards.bestBowler.wickets}/${match.awards.bestBowler.runs})</span>
                                </div>
                            `;
                        }
                        
                        html += '</div>';
                    }
                } else if (match.status === 'scheduled') {
                    html += `
                        <button class="btn btn-primary start-match-btn" 
                                onclick="tournamentManager.startMatch(${match.id})">
                            Start Match
                        </button>
                    `;
                }
                
                html += '</div>';
            });
            
            html += '</div>';
        });
        
        html += '</div>';
        fixturesDiv.innerHTML = html;
    }
    
    displayTournamentStats() {
        const statsDiv = document.getElementById('tournamentStats');
        if (!statsDiv) return;
        
        let html = '<div class="stats-grid">';
        
        if (this.tournament.stats.topScorer) {
            html += `
                <div class="stat-card">
                    <h4>Leading Run Scorer</h4>
                    <div class="stat-value">${this.tournament.stats.topScorer.name}</div>
                    <div class="stat-detail">${this.tournament.stats.topScorer.runs} runs</div>
                </div>
            `;
        }
        
        if (this.tournament.stats.topWicketTaker) {
            html += `
                <div class="stat-card">
                    <h4>Leading Wicket Taker</h4>
                    <div class="stat-value">${this.tournament.stats.topWicketTaker.name}</div>
                    <div class="stat-detail">${this.tournament.stats.topWicketTaker.wickets} wickets</div>
                </div>
            `;
        }
        
        if (this.tournament.stats.highestTeamScore) {
            html += `
                <div class="stat-card">
                    <h4>Highest Team Score</h4>
                    <div class="stat-value">${this.tournament.stats.highestTeamScore.runs}/${this.tournament.stats.highestTeamScore.wickets}</div>
                    <div class="stat-detail">${this.tournament.stats.highestTeamScore.team}</div>
                </div>
            `;
        }
        
        html += '</div>';
        statsDiv.innerHTML = html;
    }
    
    displayTournamentAwards() {
        const awardsDiv = document.getElementById('tournamentAwards');
        if (!awardsDiv) return;
        
        // Calculate tournament awards
        const awards = this.calculateTournamentAwards();
        
        let html = '<div class="awards-grid">';
        
        // Man of the Series
        if (awards.manOfTheSeries) {
            html += `
                <div class="award-card major-award">
                    <div class="award-icon">🌟</div>
                    <h4>Man of the Series</h4>
                    <div class="award-winner">${awards.manOfTheSeries.name}</div>
                    <div class="award-details">
                        ${awards.manOfTheSeries.team}<br>
                        ${awards.manOfTheSeries.momAwards} MOM Awards
                    </div>
                </div>
            `;
        }
        
        // Leading Run Scorer
        if (awards.leadingRunScorer) {
            html += `
                <div class="award-card">
                    <div class="award-icon">🏏</div>
                    <h4>Leading Run Scorer</h4>
                    <div class="award-winner">${awards.leadingRunScorer.name}</div>
                    <div class="award-details">
                        ${awards.leadingRunScorer.team}<br>
                        ${awards.leadingRunScorer.runs} runs in ${awards.leadingRunScorer.matches} matches<br>
                        Avg: ${(awards.leadingRunScorer.runs / awards.leadingRunScorer.matches).toFixed(1)}
                    </div>
                </div>
            `;
        }
        
        // Leading Wicket Taker
        if (awards.leadingWicketTaker) {
            html += `
                <div class="award-card">
                    <div class="award-icon">🎾</div>
                    <h4>Leading Wicket Taker</h4>
                    <div class="award-winner">${awards.leadingWicketTaker.name}</div>
                    <div class="award-details">
                        ${awards.leadingWicketTaker.team}<br>
                        ${awards.leadingWicketTaker.wickets} wickets in ${awards.leadingWicketTaker.matches} matches<br>
                        Avg: ${awards.leadingWicketTaker.oversBowled > 0 ? 
                            (awards.leadingWicketTaker.runsConceded / awards.leadingWicketTaker.wickets).toFixed(1) : 
                            'N/A'}
                    </div>
                </div>
            `;
        }
        
        // Best Strike Rate
        if (awards.bestStrikeRate) {
            html += `
                <div class="award-card">
                    <div class="award-icon">⚡</div>
                    <h4>Best Strike Rate</h4>
                    <div class="award-winner">${awards.bestStrikeRate.name}</div>
                    <div class="award-details">
                        ${awards.bestStrikeRate.team}<br>
                        SR: ${awards.bestStrikeRate.strikeRate.toFixed(1)}<br>
                        ${awards.bestStrikeRate.runs} runs off ${awards.bestStrikeRate.balls} balls
                    </div>
                </div>
            `;
        }
        
        // Best Economy
        if (awards.bestEconomy) {
            html += `
                <div class="award-card">
                    <div class="award-icon">🎯</div>
                    <h4>Best Economy</h4>
                    <div class="award-winner">${awards.bestEconomy.name}</div>
                    <div class="award-details">
                        ${awards.bestEconomy.team}<br>
                        Econ: ${awards.bestEconomy.economy.toFixed(2)}<br>
                        ${awards.bestEconomy.runsConceded} runs in ${awards.bestEconomy.oversBowled.toFixed(1)} overs
                    </div>
                </div>
            `;
        }
        
        // Most Sixes
        if (awards.mostSixes) {
            html += `
                <div class="award-card">
                    <div class="award-icon">💥</div>
                    <h4>Most Sixes</h4>
                    <div class="award-winner">${awards.mostSixes.name}</div>
                    <div class="award-details">
                        ${awards.mostSixes.team}<br>
                        ${awards.mostSixes.sixes} sixes
                    </div>
                </div>
            `;
        }
        
        // Most Fours
        if (awards.mostFours) {
            html += `
                <div class="award-card">
                    <div class="award-icon">💫</div>
                    <h4>Most Fours</h4>
                    <div class="award-winner">${awards.mostFours.name}</div>
                    <div class="award-details">
                        ${awards.mostFours.team}<br>
                        ${awards.mostFours.fours} fours
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        
        // Add match-wise awards section
        html += '<h4 class="section-title">Match Awards Summary</h4>';
        html += '<div class="match-awards-summary">';
        
        // Count match awards by player
        const matchAwardsSummary = {};
        this.tournament.matches.forEach(match => {
            if (match.status === 'completed' && match.awards) {
                if (match.awards.manOfTheMatch) {
                    const name = match.awards.manOfTheMatch.name;
                    if (!matchAwardsSummary[name]) {
                        matchAwardsSummary[name] = {
                            name: name,
                            team: match.awards.manOfTheMatch.team,
                            momCount: 0,
                            bestBatterCount: 0,
                            bestBowlerCount: 0
                        };
                    }
                    matchAwardsSummary[name].momCount++;
                }
                
                if (match.awards.bestBatter) {
                    const name = match.awards.bestBatter.name;
                    if (!matchAwardsSummary[name]) {
                        matchAwardsSummary[name] = {
                            name: name,
                            team: match.awards.bestBatter.team,
                            momCount: 0,
                            bestBatterCount: 0,
                            bestBowlerCount: 0
                        };
                    }
                    matchAwardsSummary[name].bestBatterCount++;
                }
                
                if (match.awards.bestBowler) {
                    const name = match.awards.bestBowler.name;
                    if (!matchAwardsSummary[name]) {
                        matchAwardsSummary[name] = {
                            name: name,
                            team: match.awards.bestBowler.team,
                            momCount: 0,
                            bestBatterCount: 0,
                            bestBowlerCount: 0
                        };
                    }
                    matchAwardsSummary[name].bestBowlerCount++;
                }
            }
        });
        
        // Display match awards summary
        const playerAwards = Object.values(matchAwardsSummary)
            .sort((a, b) => b.momCount - a.momCount);
        
        if (playerAwards.length > 0) {
            html += '<table class="awards-summary-table">';
            html += `
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Team</th>
                        <th>Man of Match</th>
                        <th>Best Batter</th>
                        <th>Best Bowler</th>
                    </tr>
                </thead>
                <tbody>
            `;
            
            playerAwards.forEach(player => {
                if (player.momCount > 0 || player.bestBatterCount > 0 || player.bestBowlerCount > 0) {
                    html += `
                        <tr>
                            <td>${player.name}</td>
                            <td>${player.team}</td>
                            <td>${player.momCount > 0 ? '🏆 ' + player.momCount : '-'}</td>
                            <td>${player.bestBatterCount > 0 ? '🏏 ' + player.bestBatterCount : '-'}</td>
                            <td>${player.bestBowlerCount > 0 ? '🎾 ' + player.bestBowlerCount : '-'}</td>
                        </tr>
                    `;
                }
            });
            
            html += '</tbody></table>';
        }
        
        html += '</div>';
        
        awardsDiv.innerHTML = html;
    }
    
    displayTeams() {
        const teamsDiv = document.getElementById('teamsList');
        if (!teamsDiv) return;
        
        let html = '';
        this.tournament.teams.forEach(team => {
            const teamData = this.tournament.pointsTable.find(t => t.name === team.name) || team;
            html += `
                <div class="team-card">
                    <h4>${team.name}</h4>
                    <div class="team-stats">
                        <div class="team-stat">
                            <span>Matches:</span> ${teamData.played || 0}
                        </div>
                        <div class="team-stat">
                            <span>Won:</span> ${teamData.won || 0}
                        </div>
                        <div class="team-stat">
                            <span>Lost:</span> ${teamData.lost || 0}
                        </div>
                        <div class="team-stat">
                            <span>Points:</span> ${teamData.points || 0}
                        </div>
                        <div class="team-stat">
                            <span>NRR:</span> ${teamData.netRunRate || '0.00'}
                        </div>
                        <div class="team-stat">
                            <span>Form:</span> ${teamData.form ? teamData.form.join(' ') : 'N/A'}
                        </div>
                    </div>
                </div>
            `;
        });
        
        teamsDiv.innerHTML = html;
    }
    
    startMatch(matchId) {
        const match = this.tournament.matches.find(m => m.id === matchId);
        if (!match || match.status !== 'scheduled') return;
        
        // Store current match in session
        sessionStorage.setItem('tournamentMatch', JSON.stringify({
            tournamentId: this.tournament.id,
            matchId: matchId,
            team1: match.team1,
            team2: match.team2
        }));
        
        // Navigate to match setup with pre-filled teams
        window.location.href = 'index.html?tournamentMatch=true';
    }
    
    saveTournament() {
        const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
        const existingIndex = tournaments.findIndex(t => t.id === this.tournament.id);
        
        if (existingIndex >= 0) {
            tournaments[existingIndex] = this.tournament;
        } else {
            tournaments.push(this.tournament);
        }
        
        localStorage.setItem('tournaments', JSON.stringify(tournaments));
        localStorage.setItem('activeTournament', JSON.stringify(this.tournament));
    }
    
    loadTournament(tournamentId) {
        const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
        const tournament = tournaments.find(t => t.id === tournamentId);
        
        if (tournament) {
            this.tournament = tournament;
            this.showTournamentDashboard();
        }
    }
    
    loadTournaments() {
        const savedTournamentsSection = document.getElementById('savedTournaments');
        const tournamentsList = document.getElementById('tournamentsList');
        
        if (!savedTournamentsSection || !tournamentsList) return;
        
        const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
        
        if (tournaments.length === 0) {
            tournamentsList.innerHTML = '<p>No saved tournaments found.</p>';
        } else {
            let html = '<div class="tournaments-grid">';
            tournaments.forEach(tournament => {
                const completedMatches = tournament.matches.filter(m => m.status === 'completed').length;
                const totalMatches = tournament.matches.length;
                
                html += `
                    <div class="tournament-card">
                        <h3>${tournament.name}</h3>
                        <p>Format: ${tournament.format}</p>
                        <p>Teams: ${tournament.teams.length}</p>
                        <p>Progress: ${completedMatches}/${totalMatches} matches</p>
                        <p>Dates: ${tournament.startDate} to ${tournament.endDate}</p>
                        <button class="btn btn-primary" onclick="tournamentManager.loadTournament(${tournament.id})">
                            Load Tournament
                        </button>
                        <button class="btn btn-danger" onclick="tournamentManager.deleteTournament(${tournament.id})">
                            Delete
                        </button>
                    </div>
                `;
            });
            html += '</div>';
            tournamentsList.innerHTML = html;
        }
        
        // Show the saved tournaments section
        document.getElementById('tournamentSetup').style.display = 'none';
        document.getElementById('tournamentDashboard').style.display = 'none';
        savedTournamentsSection.style.display = 'block';
    }
    
    deleteTournament(tournamentId) {
        if (confirm('Are you sure you want to delete this tournament?')) {
            let tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
            tournaments = tournaments.filter(t => t.id !== tournamentId);
            localStorage.setItem('tournaments', JSON.stringify(tournaments));
            
            // If this was the active tournament, remove it
            const activeTournament = JSON.parse(localStorage.getItem('activeTournament') || '{}');
            if (activeTournament.id === tournamentId) {
                localStorage.removeItem('activeTournament');
            }
            
            // Refresh the list
            this.loadTournaments();
        }
    }
    
    addTeamInput() {
        const container = document.getElementById('teamsContainer');
        const teamCount = container.querySelectorAll('.team-input').length + 1;
        
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `
            <input type="text" class="team-input" placeholder="Team ${teamCount} Name" required onblur="tournamentManager.checkDuplicateTeams()">
            <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove(); tournamentManager.checkDuplicateTeams()">Remove</button>
        `;
        
        container.appendChild(div);
    }
    
    checkDuplicateTeams() {
        const teamInputs = document.querySelectorAll('.team-input');
        const teamNames = Array.from(teamInputs).map(input => input.value.trim().toLowerCase());
        
        // Reset all inputs style
        teamInputs.forEach(input => {
            input.style.borderColor = '#ddd';
            input.title = '';
        });
        
        // Check for duplicates and highlight
        teamNames.forEach((name, index) => {
            if (name && teamNames.indexOf(name) !== index) {
                teamInputs[index].style.borderColor = '#dc3545';
                teamInputs[index].title = 'Duplicate team name';
                teamInputs[teamNames.indexOf(name)].style.borderColor = '#dc3545';
                teamInputs[teamNames.indexOf(name)].title = 'Duplicate team name';
            }
        });
    }
    
    handleFormatChange(e) {
        const format = e.target.value;
        const teamsContainer = document.getElementById('teamsContainer');
        const currentTeams = teamsContainer.querySelectorAll('.team-input').length;
        
        // Adjust minimum teams based on format
        const minTeams = this.getMinimumTeamsForFormat(format);
        
        if (currentTeams < minTeams) {
            // Add more team inputs
            for (let i = currentTeams; i < minTeams; i++) {
                this.addTeamInput();
            }
        }
        
        // Update format description
        const formatDesc = document.getElementById('formatDescription');
        if (formatDesc) {
            formatDesc.textContent = this.getFormatDescription(format);
        }
    }
    
    getMinimumTeamsForFormat(format) {
        switch(format) {
            case 'knockout': return 4;
            case 'league': return 4;
            case 'mixed': return 8;
            default: return 4;
        }
    }
    
    getFormatDescription(format) {
        switch(format) {
            case 'knockout':
                return 'Single elimination tournament. Teams are eliminated after one loss.';
            case 'league':
                return 'Round-robin format. Each team plays every other team once.';
            case 'mixed':
                return 'Group stage followed by knockout playoffs. Teams divided into groups, top teams advance.';
            default:
                return '';
        }
    }
    
    exportTournamentData() {
        const data = {
            tournament: this.tournament,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.tournament.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    extractManOfTheMatch(matchData) {
        let candidates = [];
        
        // Add batsmen from both teams
        [...matchData.team1.batting, ...matchData.team2.batting].forEach(player => {
            if (player.runs > 0) {
                const sr = player.balls > 0 ? (player.runs / player.balls) * 100 : 0;
                candidates.push({
                    name: player.name,
                    team: player.team || (matchData.team1.batting.includes(player) ? matchData.team1.name : matchData.team2.name),
                    runs: player.runs,
                    balls: player.balls,
                    wickets: 0,
                    performance: player.runs + (sr > 150 ? 20 : sr > 100 ? 10 : 0),
                    type: 'batter'
                });
            }
        });
        
        // Add bowlers from both teams
        [...matchData.team2.bowling, ...matchData.team1.bowling].forEach(player => {
            if (player.wickets > 0 || player.overs > 0) {
                const economy = player.overs > 0 ? player.runs / player.overs : 0;
                candidates.push({
                    name: player.name,
                    team: player.team || (matchData.team2.bowling.includes(player) ? matchData.team2.name : matchData.team1.name),
                    wickets: player.wickets,
                    runs: player.runs,
                    overs: player.overs,
                    performance: (player.wickets * 25) + (economy < 6 ? 15 : economy < 8 ? 10 : 0),
                    type: 'bowler'
                });
            }
        });
        
        // Give bonus to winning team players
        const winningTeam = matchData.winner;
        candidates.forEach(player => {
            if (player.team === winningTeam) {
                player.performance += 10;
            }
        });
        
        // Find best performer
        return candidates.reduce((best, player) => 
            player.performance > (best?.performance || 0) ? player : best, null);
    }
    
    extractBestBatter(matchData) {
        const batsmen = [...matchData.team1.batting, ...matchData.team2.batting];
        return batsmen.reduce((best, player) => {
            if (player.runs > (best?.runs || 0)) {
                return {
                    name: player.name,
                    team: player.team || (matchData.team1.batting.includes(player) ? matchData.team1.name : matchData.team2.name),
                    runs: player.runs,
                    balls: player.balls,
                    fours: player.fours || 0,
                    sixes: player.sixes || 0
                };
            }
            return best;
        }, null);
    }
    
    extractBestBowler(matchData) {
        const bowlers = [...matchData.team1.bowling, ...matchData.team2.bowling];
        return bowlers.reduce((best, player) => {
            // Compare by wickets first, then by economy
            if (player.wickets > (best?.wickets || 0) || 
                (player.wickets === (best?.wickets || 0) && 
                 player.overs > 0 && 
                 (player.runs/player.overs) < ((best?.runs || 0)/(best?.overs || 1)))) {
                return {
                    name: player.name,
                    team: player.team || (matchData.team1.bowling.includes(player) ? matchData.team1.name : matchData.team2.name),
                    wickets: player.wickets,
                    runs: player.runs,
                    overs: player.overs,
                    balls: player.balls,
                    economy: player.overs > 0 ? (player.runs / player.overs).toFixed(2) : '0.00'
                };
            }
            return best;
        }, null);
    }
    
    calculateTournamentAwards() {
        const awards = {
            manOfTheSeries: null,
            leadingRunScorer: null,
            leadingWicketTaker: null,
            bestStrikeRate: null,
            bestEconomy: null,
            mostSixes: null,
            mostFours: null
        };
        
        const playerStats = {};
        
        // Aggregate stats from all completed matches
        this.tournament.matches.forEach(match => {
            if (match.status === 'completed' && match.scorecard) {
                // Process batting stats
                [...match.scorecard.team1.batting, ...match.scorecard.team2.batting].forEach(player => {
                    if (!playerStats[player.name]) {
                        playerStats[player.name] = {
                            name: player.name,
                            team: player.team || (match.scorecard.team1.batting.includes(player) ? 
                                   match.scorecard.team1.name : match.scorecard.team2.name),
                            matches: 0,
                            runs: 0,
                            balls: 0,
                            wickets: 0,
                            oversBowled: 0,
                            runsConceded: 0,
                            fours: 0,
                            sixes: 0,
                            momAwards: 0
                        };
                    }
                    
                    const stats = playerStats[player.name];
                    stats.matches++;
                    stats.runs += player.runs || 0;
                    stats.balls += player.balls || 0;
                    stats.fours += player.fours || 0;
                    stats.sixes += player.sixes || 0;
                });
                
                // Process bowling stats
                [...match.scorecard.team1.bowling, ...match.scorecard.team2.bowling].forEach(player => {
                    if (!playerStats[player.name]) {
                        playerStats[player.name] = {
                            name: player.name,
                            team: player.team || (match.scorecard.team1.bowling.includes(player) ? 
                                   match.scorecard.team1.name : match.scorecard.team2.name),
                            matches: 0,
                            runs: 0,
                            balls: 0,
                            wickets: 0,
                            oversBowled: 0,
                            runsConceded: 0,
                            fours: 0,
                            sixes: 0,
                            momAwards: 0
                        };
                    }
                    
                    const stats = playerStats[player.name];
                    stats.wickets += player.wickets || 0;
                    stats.oversBowled += player.overs + (player.balls / 6) || 0;
                    stats.runsConceded += player.runs || 0;
                });
                
                // Count MOM awards
                if (match.awards && match.awards.manOfTheMatch) {
                    const momName = match.awards.manOfTheMatch.name;
                    if (playerStats[momName]) {
                        playerStats[momName].momAwards++;
                    }
                }
            }
        });
        
        // Calculate awards
        const players = Object.values(playerStats);
        
        // Leading run scorer
        awards.leadingRunScorer = players.reduce((best, player) => 
            player.runs > (best?.runs || 0) ? player : best, null);
        
        // Leading wicket taker
        awards.leadingWicketTaker = players.reduce((best, player) => 
            player.wickets > (best?.wickets || 0) ? player : best, null);
        
        // Man of the Series (player with most MOM awards)
        awards.manOfTheSeries = players.reduce((best, player) => 
            player.momAwards > (best?.momAwards || 0) ? player : best, null);
        
        // Best Strike Rate (minimum 50 runs)
        const eligibleBatsmen = players.filter(p => p.runs >= 50 && p.balls > 0);
        if (eligibleBatsmen.length > 0) {
            awards.bestStrikeRate = eligibleBatsmen.reduce((best, player) => {
                player.strikeRate = (player.runs / player.balls) * 100;
                return player.strikeRate > (best?.strikeRate || 0) ? player : best;
            }, null);
        }
        
        // Best Economy (minimum 5 overs bowled)
        const eligibleBowlers = players.filter(p => p.oversBowled >= 5);
        if (eligibleBowlers.length > 0) {
            awards.bestEconomy = eligibleBowlers.reduce((best, player) => {
                player.economy = player.runsConceded / player.oversBowled;
                return (!best || player.economy < best.economy) ? player : best;
            }, null);
        }
        
        // Most Sixes
        awards.mostSixes = players.reduce((best, player) => 
            player.sixes > (best?.sixes || 0) ? player : best, null);
        
        // Most Fours
        awards.mostFours = players.reduce((best, player) => 
            player.fours > (best?.fours || 0) ? player : best, null);
        
        return awards;
    }
}

// Initialize tournament manager
const tournamentManager = new TournamentManager();