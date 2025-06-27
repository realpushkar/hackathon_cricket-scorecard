class CricketMatch {
    constructor() {
        this.matchData = {
            format: '',
            totalOvers: 0,
            team1: { name: '', runs: 0, wickets: 0, overs: 0, balls: 0, batting: [], bowling: [], extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 } },
            team2: { name: '', runs: 0, wickets: 0, overs: 0, balls: 0, batting: [], bowling: [], extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 } },
            currentInnings: 1,
            tossWinner: '',
            tossDecision: '',
            battingTeam: null,
            bowlingTeam: null,
            currentBatsmen: { striker: null, nonStriker: null },
            currentBowler: null,
            previousBowler: null,
            thisOver: [],
            target: 0,
            matchStatus: 'setup',
            ballHistory: []
        };
        
        // Check for saved active match
        this.loadActiveMatch();
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('matchSetupForm').addEventListener('submit', (e) => this.startMatch(e));
        document.getElementById('matchFormat').addEventListener('change', this.handleFormatChange);
        document.getElementById('team1Name').addEventListener('input', this.updateTossOptions);
        document.getElementById('team2Name').addEventListener('input', this.updateTossOptions);
        document.getElementById('team1Name').addEventListener('input', this.updatePlayerTitles);
        document.getElementById('team2Name').addEventListener('input', this.updatePlayerTitles);
        
        document.querySelectorAll('.run-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.scoreRuns(parseInt(e.target.dataset.runs)));
        });
        
        document.querySelectorAll('.extra-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.scoreExtras(e.target.dataset.extra));
        });
        
        document.getElementById('wicketBtn').addEventListener('click', () => this.showWicketOptions());
        document.getElementById('wicketType').addEventListener('change', (e) => this.recordWicket(e.target.value));
        document.getElementById('endOver').addEventListener('click', () => this.endOver());
        document.getElementById('endInnings').addEventListener('click', () => this.endInnings());
        document.getElementById('viewScorecard').addEventListener('click', () => this.showScorecard());
        document.getElementById('backToScoring').addEventListener('click', () => this.backToScoring());
        document.getElementById('saveMatch').addEventListener('click', () => this.saveMatch());
        document.getElementById('shareScorecard').addEventListener('click', () => this.shareScorecard());
        document.getElementById('selectBowlerBtn').addEventListener('click', () => this.showBowlerSelection());
        document.getElementById('bowlerSelect').addEventListener('change', (e) => this.changeBowler(e.target.value));
        document.getElementById('selectBatterBtn').addEventListener('click', () => this.showBatterSelection());
        document.getElementById('batterSelect').addEventListener('change', (e) => {
            if (e.target.value !== '') {
                this.changeBatter(e.target.value);
            }
        });
        document.getElementById('undoLastBall').addEventListener('click', () => this.undoLastBall());
        
        document.getElementById('navSetup').addEventListener('click', () => this.navigateTo('setup'));
        document.getElementById('navScoring').addEventListener('click', () => this.navigateTo('scoring'));
        document.getElementById('navScorecard').addEventListener('click', () => this.navigateTo('scorecard'));
        document.getElementById('navHistory').addEventListener('click', () => this.navigateTo('history'));
        document.getElementById('navNewMatch').addEventListener('click', () => this.startNewMatch());
        document.getElementById('newMatch').addEventListener('click', () => this.startNewMatch());
        
        this.loadMatchHistory();
        
        // Pre-populate teams if coming from tournament
        this.checkTournamentMatch();
    }
    
    checkTournamentMatch() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tournamentMatch') === 'true') {
            const tournamentMatch = JSON.parse(sessionStorage.getItem('tournamentMatch') || '{}');
            if (tournamentMatch.team1 && tournamentMatch.team2) {
                document.getElementById('team1Name').value = tournamentMatch.team1;
                document.getElementById('team2Name').value = tournamentMatch.team2;
                this.updateTossOptions();
                
                // Add tournament info to header
                const matchInfo = document.getElementById('matchInfo');
                if (matchInfo) {
                    matchInfo.textContent = 'Tournament Match';
                }
            }
        }
    }

    handleFormatChange(e) {
        const format = e.target.value;
        const customOversInput = document.getElementById('customOvers');
        if (format === 'Custom') {
            customOversInput.style.display = 'block';
            customOversInput.required = true;
        } else {
            customOversInput.style.display = 'none';
            customOversInput.required = false;
        }
    }

    updateTossOptions() {
        const team1 = document.getElementById('team1Name').value;
        const team2 = document.getElementById('team2Name').value;
        const tossWinner = document.getElementById('tossWinner');
        
        tossWinner.innerHTML = '<option value="">Select Team</option>';
        if (team1) tossWinner.innerHTML += `<option value="${team1}">${team1}</option>`;
        if (team2) tossWinner.innerHTML += `<option value="${team2}">${team2}</option>`;
    }

    updatePlayerTitles() {
        const team1Name = document.getElementById('team1Name').value || 'Team 1';
        const team2Name = document.getElementById('team2Name').value || 'Team 2';
        
        document.getElementById('team1PlayersTitle').textContent = `${team1Name} Players`;
        document.getElementById('team2PlayersTitle').textContent = `${team2Name} Players`;
    }

    startMatch(e) {
        e.preventDefault();
        
        const format = document.getElementById('matchFormat').value;
        let team1Name = document.getElementById('team1Name').value;
        let team2Name = document.getElementById('team2Name').value;
        const tossWinner = document.getElementById('tossWinner').value;
        const tossDecision = document.getElementById('tossDecision').value;
        
        // Check if this is a tournament match
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tournamentMatch') === 'true') {
            const tournamentMatch = JSON.parse(sessionStorage.getItem('tournamentMatch') || '{}');
            if (tournamentMatch.team1 && tournamentMatch.team2) {
                team1Name = tournamentMatch.team1;
                team2Name = tournamentMatch.team2;
                this.matchData.tournamentId = tournamentMatch.tournamentId;
                this.matchData.tournamentMatchId = tournamentMatch.matchId;
            }
        }
        
        this.matchData.format = format;
        const totalOvers = this.getOversForFormat(format);
        if (totalOvers === null) {
            return; // Don't start match if invalid overs
        }
        this.matchData.totalOvers = totalOvers;
        this.matchData.team1.name = team1Name;
        this.matchData.team2.name = team2Name;
        this.matchData.tossWinner = tossWinner;
        this.matchData.tossDecision = tossDecision;
        
        if (tossDecision === 'bat') {
            this.matchData.battingTeam = tossWinner === team1Name ? this.matchData.team1 : this.matchData.team2;
            this.matchData.bowlingTeam = tossWinner === team1Name ? this.matchData.team2 : this.matchData.team1;
        } else {
            this.matchData.bowlingTeam = tossWinner === team1Name ? this.matchData.team1 : this.matchData.team2;
            this.matchData.battingTeam = tossWinner === team1Name ? this.matchData.team2 : this.matchData.team1;
        }
        
        this.initializePlayers();
        this.matchData.matchStatus = 'live';
        
        // Clear any previous active match
        this.clearActiveMatch();
        
        // Show Select Batter button to choose opening batsmen
        document.getElementById('selectBatterBtn').style.display = 'block';
        document.getElementById('selectBatterBtn').textContent = 'Select Opening Batsmen';
        
        document.getElementById('matchSetup').style.display = 'none';
        document.getElementById('scoringSection').style.display = 'block';
        document.getElementById('navigation').style.display = 'flex';
        this.updateDisplay();
        this.updateNavigation('scoring');
    }

    getOversForFormat(format) {
        switch(format) {
            case 'T20': return 20;
            case 'ODI': return 50;
            case 'Test': return 450;
            case 'Custom': 
                const customOvers = parseInt(document.getElementById('customOvers').value);
                if (isNaN(customOvers) || customOvers < 1) {
                    alert('Please enter a valid number of overs (minimum 1)');
                    return null;
                }
                return customOvers;
            default: return 20;
        }
    }

    initializePlayers() {
        const team1Players = document.querySelectorAll('[data-team="1"]');
        const team2Players = document.querySelectorAll('[data-team="2"]');
        
        for (let i = 0; i < 11; i++) {
            const team1PlayerName = team1Players[i]?.value || `${this.matchData.team1.name} Player ${i + 1}`;
            const team2PlayerName = team2Players[i]?.value || `${this.matchData.team2.name} Player ${i + 1}`;
            
            const team1Player = {
                name: team1PlayerName,
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                out: false,
                howOut: ''
            };
            
            const team2Player = {
                name: team2PlayerName,
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                out: false,
                howOut: ''
            };
            
            if (this.matchData.battingTeam === this.matchData.team1) {
                this.matchData.battingTeam.batting.push(team1Player);
                this.matchData.bowlingTeam.batting.push(team2Player);
            } else {
                this.matchData.battingTeam.batting.push(team2Player);
                this.matchData.bowlingTeam.batting.push(team1Player);
            }
        }
        
        for (let i = 0; i < 11; i++) {
            const team1BowlerName = team1Players[i]?.value || `${this.matchData.team1.name} Player ${i + 1}`;
            const team2BowlerName = team2Players[i]?.value || `${this.matchData.team2.name} Player ${i + 1}`;
            
            this.matchData.team1.bowling.push({
                name: team1BowlerName,
                overs: 0,
                balls: 0,
                runs: 0,
                wickets: 0,
                maidens: 0,
                available: true
            });
            
            this.matchData.team2.bowling.push({
                name: team2BowlerName,
                overs: 0,
                balls: 0,
                runs: 0,
                wickets: 0,
                maidens: 0,
                available: true
            });
        }
        
        // Don't auto-select batsmen - user will select them
        // this.matchData.currentBatsmen.striker = this.matchData.battingTeam.batting[0];
        // this.matchData.currentBatsmen.nonStriker = this.matchData.battingTeam.batting[1];
        this.matchData.currentBowler = this.matchData.bowlingTeam.bowling[0];
        
        // Disable scoring buttons until opening batsmen are selected
        document.querySelectorAll('.run-btn, .extra-btn, #wicketBtn').forEach(btn => {
            btn.disabled = true;
        });
    }

    scoreRuns(runs) {
        if (this.matchData.matchStatus !== 'live') return;
        
        // Ensure batsmen are selected
        if (!this.matchData.currentBatsmen.striker || !this.matchData.currentBatsmen.nonStriker) {
            alert('Please select opening batsmen first');
            return;
        }
        
        // Save current state before scoring
        this.saveBallState();
        
        this.matchData.battingTeam.runs += runs;
        this.matchData.currentBatsmen.striker.runs += runs;
        this.matchData.currentBatsmen.striker.balls += 1;
        this.matchData.currentBowler.runs += runs;
        this.matchData.currentBowler.balls += 1;
        this.matchData.battingTeam.balls += 1;
        
        if (runs === 4) this.matchData.currentBatsmen.striker.fours += 1;
        if (runs === 6) this.matchData.currentBatsmen.striker.sixes += 1;
        
        this.matchData.thisOver.push(runs.toString());
        
        if (runs % 2 === 1) {
            this.swapBatsmen();
        }
        
        // console.log(`Runs: ${runs}, Bowler balls: ${this.matchData.currentBowler.balls}, Team balls: ${this.matchData.battingTeam.balls}`);
        
        this.checkOverComplete();
        this.updateDisplay();
        this.checkMatchComplete();
    }

    scoreExtras(type) {
        if (this.matchData.matchStatus !== 'live') return;
        
        // Ensure batsmen are selected
        if (!this.matchData.currentBatsmen.striker || !this.matchData.currentBatsmen.nonStriker) {
            alert('Please select opening batsmen first');
            return;
        }
        
        // Save current state before scoring
        this.saveBallState();
        
        let extraRuns = 1;
        let ballCounts = true;
        
        switch(type) {
            case 'wide':
                this.matchData.thisOver.push('wd');
                ballCounts = false;
                this.matchData.battingTeam.extras.wides += extraRuns;
                break;
            case 'noball':
                this.matchData.thisOver.push('nb');
                ballCounts = false;
                this.matchData.battingTeam.extras.noBalls += extraRuns;
                break;
            case 'bye':
                this.matchData.thisOver.push('b');
                this.matchData.battingTeam.extras.byes += extraRuns;
                break;
            case 'legbye':
                this.matchData.thisOver.push('lb');
                this.matchData.battingTeam.extras.legByes += extraRuns;
                break;
        }
        
        this.matchData.battingTeam.runs += extraRuns;
        this.matchData.battingTeam.extras.total += extraRuns;
        
        // Only add to bowler's runs for wides and no-balls
        if (type === 'wide' || type === 'noball') {
            this.matchData.currentBowler.runs += extraRuns;
        }
        
        if (ballCounts) {
            this.matchData.currentBowler.balls += 1;
            this.matchData.battingTeam.balls += 1;
            this.checkOverComplete();
        }
        
        // console.log(`Extra: ${type}, Ball counts: ${ballCounts}, Bowler balls: ${this.matchData.currentBowler.balls}, Team balls: ${this.matchData.battingTeam.balls}`);
        
        this.updateDisplay();
        this.checkMatchComplete();
    }

    showWicketOptions() {
        document.getElementById('wicketType').style.display = 'block';
    }

    recordWicket(wicketType) {
        if (!wicketType || this.matchData.matchStatus !== 'live') return;
        
        // Handle cancel option
        if (wicketType === 'cancel') {
            document.getElementById('wicketType').style.display = 'none';
            document.getElementById('wicketType').value = '';
            return;
        }
        
        // Save current state before recording wicket
        this.saveBallState();
        
        this.matchData.battingTeam.wickets += 1;
        this.matchData.currentBowler.wickets += 1;
        this.matchData.currentBowler.balls += 1;
        this.matchData.battingTeam.balls += 1;
        this.matchData.currentBatsmen.striker.out = true;
        this.matchData.currentBatsmen.striker.howOut = wicketType;
        
        this.matchData.thisOver.push('W');
        
        document.getElementById('wicketType').style.display = 'none';
        document.getElementById('wicketType').value = '';
        
        if (this.matchData.battingTeam.wickets < 10) {
            // Show Select Batter button instead of automatically selecting next batsman
            document.getElementById('selectBatterBtn').style.display = 'block';
            // Disable scoring buttons until batter is selected
            document.querySelectorAll('.run-btn, .extra-btn, #wicketBtn').forEach(btn => {
                btn.disabled = true;
            });
        } else {
            this.endInnings();
        }
        
        this.checkOverComplete();
        this.updateDisplay();
    }

    swapBatsmen() {
        const temp = this.matchData.currentBatsmen.striker;
        this.matchData.currentBatsmen.striker = this.matchData.currentBatsmen.nonStriker;
        this.matchData.currentBatsmen.nonStriker = temp;
    }

    checkOverComplete() {
        if (this.matchData.currentBowler.balls >= 6) {
            this.endOver();
        } else if (this.matchData.battingTeam.balls >= 6) {
            this.matchData.battingTeam.overs += 1;
            this.matchData.battingTeam.balls = 0;
        }
    }
    
    checkMatchComplete() {
        // Check if chasing team has reached the target
        if (this.matchData.currentInnings === 2 && this.matchData.target > 0) {
            if (this.matchData.battingTeam.runs >= this.matchData.target) {
                this.matchData.matchStatus = 'completed';
                this.determineWinner();
            }
        }
    }

    endOver() {
        this.matchData.currentBowler.overs += 1;
        this.matchData.currentBowler.balls = 0;
        this.matchData.battingTeam.overs += 1;
        this.matchData.battingTeam.balls = 0;
        
        if (this.matchData.thisOver.filter(ball => !['wd', 'nb'].includes(ball)).every(ball => ball === '0')) {
            this.matchData.currentBowler.maidens += 1;
        }
        
        // Store the previous bowler
        this.matchData.previousBowler = this.matchData.currentBowler;
        
        this.matchData.thisOver = [];
        this.swapBatsmen();
        
        alert('Over completed! Please select the next bowler.');
        
        if (this.matchData.battingTeam.overs >= this.matchData.totalOvers) {
            this.endInnings();
        }
        
        this.updateDisplay();
    }

    endInnings() {
        if (this.matchData.currentInnings === 1) {
            this.matchData.target = this.matchData.battingTeam.runs + 1;
            this.matchData.currentInnings = 2;
            
            const temp = this.matchData.battingTeam;
            this.matchData.battingTeam = this.matchData.bowlingTeam;
            this.matchData.bowlingTeam = temp;
            
            // Don't auto-select batsmen for second innings either
            this.matchData.currentBatsmen.striker = null;
            this.matchData.currentBatsmen.nonStriker = null;
            this.matchData.currentBowler = this.matchData.bowlingTeam.bowling[0];
            this.matchData.thisOver = [];
            
            // Show Select Batter button for second innings
            document.getElementById('selectBatterBtn').style.display = 'block';
            document.getElementById('selectBatterBtn').textContent = 'Select Opening Batsmen';
            
            // Disable scoring buttons until opening batsmen are selected
            document.querySelectorAll('.run-btn, .extra-btn, #wicketBtn').forEach(btn => {
                btn.disabled = true;
            });
            
            alert(`End of first innings. ${this.matchData.bowlingTeam.name} scored ${this.matchData.bowlingTeam.runs}/${this.matchData.bowlingTeam.wickets}. Target: ${this.matchData.target}`);
        } else {
            this.matchData.matchStatus = 'completed';
            this.determineWinner();
        }
        
        this.updateDisplay();
    }

    determineWinner() {
        let result = '';
        let winningTeam = '';
        
        // Check for tie first
        if (this.matchData.currentInnings === 2 && 
            this.matchData.battingTeam.runs === (this.matchData.target - 1)) {
            result = 'Match Tied!';
            this.matchData.winner = null;
            this.matchData.result = result;
        } else if (this.matchData.battingTeam.runs >= this.matchData.target) {
            winningTeam = this.matchData.battingTeam.name;
            result = `${this.matchData.battingTeam.name} won by ${10 - this.matchData.battingTeam.wickets} wickets`;
            this.matchData.winner = winningTeam;
            this.matchData.result = result;
        } else {
            winningTeam = this.matchData.bowlingTeam.name;
            result = `${this.matchData.bowlingTeam.name} won by ${this.matchData.target - this.matchData.battingTeam.runs - 1} runs`;
            this.matchData.winner = winningTeam;
            this.matchData.result = result;
        }
        
        // Clear active match as it's completed
        this.clearActiveMatch();
        
        // Update tournament if this is a tournament match
        if (this.matchData.tournamentId && this.matchData.tournamentMatchId) {
            this.updateTournamentMatch();
        }
        
        alert(result);
        this.showScorecard();
    }

    updateDisplay() {
        document.getElementById('battingTeamName').textContent = this.matchData.battingTeam.name;
        document.getElementById('totalRuns').textContent = this.matchData.battingTeam.runs;
        document.getElementById('totalWickets').textContent = this.matchData.battingTeam.wickets;
        document.getElementById('currentOvers').textContent = `${this.matchData.battingTeam.overs}.${this.matchData.battingTeam.balls}`;
        
        const totalOvers = this.matchData.battingTeam.overs + this.matchData.battingTeam.balls/6;
        const runRate = totalOvers > 0 ? 
            (this.matchData.battingTeam.runs / totalOvers).toFixed(2) : '0.00';
        document.getElementById('runRate').textContent = runRate;
        
        if (this.matchData.currentBatsmen.striker) {
            document.getElementById('striker').textContent = this.matchData.currentBatsmen.striker.name + '*';
            document.getElementById('strikerRuns').textContent = this.matchData.currentBatsmen.striker.runs;
            document.getElementById('strikerBalls').textContent = this.matchData.currentBatsmen.striker.balls;
            // Show change button only if batsman hasn't scored yet
            document.getElementById('changeStrikerBtn').style.display = 
                this.matchData.currentBatsmen.striker.balls === 0 && this.matchData.matchStatus === 'live' ? 'block' : 'none';
        } else {
            document.getElementById('striker').textContent = 'Select Batsman';
            document.getElementById('strikerRuns').textContent = '0';
            document.getElementById('strikerBalls').textContent = '0';
            document.getElementById('changeStrikerBtn').style.display = 'none';
        }
        
        if (this.matchData.currentBatsmen.nonStriker) {
            document.getElementById('nonStriker').textContent = this.matchData.currentBatsmen.nonStriker.name;
            document.getElementById('nonStrikerRuns').textContent = this.matchData.currentBatsmen.nonStriker.runs;
            document.getElementById('nonStrikerBalls').textContent = this.matchData.currentBatsmen.nonStriker.balls;
            // Show change button only if batsman hasn't scored yet
            document.getElementById('changeNonStrikerBtn').style.display = 
                this.matchData.currentBatsmen.nonStriker.balls === 0 && this.matchData.matchStatus === 'live' ? 'block' : 'none';
        } else {
            document.getElementById('nonStriker').textContent = 'Select Batsman';
            document.getElementById('nonStrikerRuns').textContent = '0';
            document.getElementById('nonStrikerBalls').textContent = '0';
            document.getElementById('changeNonStrikerBtn').style.display = 'none';
        }
        
        if (this.matchData.currentBowler) {
            document.getElementById('currentBowler').textContent = this.matchData.currentBowler.name;
            document.getElementById('bowlerOvers').textContent = `${this.matchData.currentBowler.overs}.${this.matchData.currentBowler.balls}`;
            document.getElementById('bowlerMaidens').textContent = this.matchData.currentBowler.maidens;
            document.getElementById('bowlerRuns').textContent = this.matchData.currentBowler.runs;
            document.getElementById('bowlerWickets').textContent = this.matchData.currentBowler.wickets;
        }
        
        const validBalls = this.matchData.thisOver.filter(ball => !['wd', 'nb'].includes(ball)).length;
        document.getElementById('thisOver').textContent = this.matchData.thisOver.join(' ') + ` (${validBalls} valid balls)`;
        
        // Update extras display
        if (this.matchData.battingTeam && this.matchData.battingTeam.extras) {
            document.getElementById('extrasTotal').textContent = this.matchData.battingTeam.extras.total || 0;
            
            let extrasBreakdown = [];
            if (this.matchData.battingTeam.extras.wides > 0) {
                extrasBreakdown.push(`wd ${this.matchData.battingTeam.extras.wides}`);
            }
            if (this.matchData.battingTeam.extras.noBalls > 0) {
                extrasBreakdown.push(`nb ${this.matchData.battingTeam.extras.noBalls}`);
            }
            if (this.matchData.battingTeam.extras.byes > 0) {
                extrasBreakdown.push(`b ${this.matchData.battingTeam.extras.byes}`);
            }
            if (this.matchData.battingTeam.extras.legByes > 0) {
                extrasBreakdown.push(`lb ${this.matchData.battingTeam.extras.legByes}`);
            }
            
            document.getElementById('extrasBreakdown').textContent = extrasBreakdown.length > 0 ? 
                `(${extrasBreakdown.join(', ')})` : '';
        } else {
            // Default display if extras not available
            document.getElementById('extrasTotal').textContent = '0';
            document.getElementById('extrasBreakdown').textContent = '';
        }
        
        if (this.matchData.currentInnings === 2 && this.matchData.target > 0) {
            const requiredRuns = this.matchData.target - this.matchData.battingTeam.runs;
            const ballsRemaining = (this.matchData.totalOvers * 6) - (this.matchData.battingTeam.overs * 6 + this.matchData.battingTeam.balls);
            const requiredRate = ballsRemaining > 0 ? (requiredRuns * 6 / ballsRemaining).toFixed(2) : '0.00';
            
            document.getElementById('matchInfo').textContent = `Target: ${this.matchData.target} | Required: ${requiredRuns} runs from ${ballsRemaining} balls | RRR: ${requiredRate}`;
        }
        
        // Disable/enable buttons based on match status
        const undoButton = document.getElementById('undoLastBall');
        if (undoButton) {
            undoButton.disabled = this.matchData.matchStatus !== 'live';
        }
        
        // Disable scoring buttons if match is completed
        if (this.matchData.matchStatus === 'completed') {
            document.querySelectorAll('.run-btn, .extra-btn, #wicketBtn, #endOver, #endInnings').forEach(btn => {
                btn.disabled = true;
            });
        }
        
        // Auto-save active match
        this.saveActiveMatch();
    }

    showScorecard() {
        document.getElementById('scoringSection').style.display = 'none';
        document.getElementById('scorecardSection').style.display = 'block';
        
        // Show winner announcement if match is completed
        if (this.matchData.matchStatus === 'completed') {
            document.getElementById('matchResultSection').style.display = 'block';
            if (this.matchData.winner) {
                document.getElementById('winnerTeam').textContent = this.matchData.winner;
            } else {
                document.getElementById('winnerTeam').textContent = 'Match Tied';
            }
            document.getElementById('matchResult').textContent = this.matchData.result;
        }
        
        let scorecardHTML = '';
        
        const teams = this.matchData.currentInnings === 1 ? 
            [this.matchData.battingTeam] : 
            [this.matchData.team1, this.matchData.team2];
        
        teams.forEach(team => {
            const isWinner = this.matchData.winner && this.matchData.winner === team.name;
            const isTied = !this.matchData.winner && this.matchData.matchStatus === 'completed';
            scorecardHTML += `
                <div class="batting-card ${isWinner ? 'winning-team-highlight' : ''}">
                    <h3>${team.name} ${isWinner ? '🏆' : ''} ${isTied ? '🤝' : ''} - ${team.runs || 0}/${team.wickets || 0} (${team.overs || 0}.${team.balls || 0} overs)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Batsman</th>
                                <th>Runs</th>
                                <th>Balls</th>
                                <th>4s</th>
                                <th>6s</th>
                                <th>SR</th>
                            </tr>
                        </thead>
                        <tbody>`;
            
            team.batting.forEach((batsman, batsmanIndex) => {
                if (batsman.balls > 0 || batsman.out) {
                    const strikeRate = batsman.balls > 0 ? (batsman.runs * 100 / batsman.balls).toFixed(2) : '0.00';
                    const teamIndex = team === this.matchData.team1 ? 1 : 2;
                    scorecardHTML += `
                        <tr>
                            <td>
                                <div class="player-name-container">
                                    <span class="batsman-name-display" id="batsmanDisplay_${teamIndex}_${batsmanIndex}" 
                                          ondblclick="cricketMatch.editBatsmanName(${teamIndex}, ${batsmanIndex})"
                                          title="Double-click to edit">${batsman.name}</span>
                                    <input type="text" class="batsman-name-edit" id="batsmanEdit_${teamIndex}_${batsmanIndex}" 
                                           value="${batsman.name}" style="display:none;" 
                                           onblur="cricketMatch.saveBatsmanName(${teamIndex}, ${batsmanIndex})"
                                           onkeypress="if(event.key==='Enter') cricketMatch.saveBatsmanName(${teamIndex}, ${batsmanIndex})">
                                    <button class="edit-btn" onclick="cricketMatch.editBatsmanName(${teamIndex}, ${batsmanIndex})" title="Edit name">✏️</button>
                                    <span class="dismissal-text">${batsman.out ? '(' + batsman.howOut + ')' : 'not out'}</span>
                                </div>
                            </td>
                            <td>${batsman.runs}</td>
                            <td>${batsman.balls}</td>
                            <td>${batsman.fours}</td>
                            <td>${batsman.sixes}</td>
                            <td>${strikeRate}</td>
                        </tr>`;
                }
            });
            
            scorecardHTML += `
                        </tbody>
                    </table>`;
            
            // Add extras breakdown
            if (team.extras && team.extras.total > 0) {
                scorecardHTML += `
                    <div class="extras-section">
                        <p><strong>Extras: ${team.extras.total}</strong> 
                        (Wides: ${team.extras.wides}, No Balls: ${team.extras.noBalls}, 
                         Byes: ${team.extras.byes}, Leg Byes: ${team.extras.legByes})</p>
                    </div>`;
            }
            
            scorecardHTML += `</div>`;
        });
        
        teams.forEach((team, index) => {
            const bowlingTeam = index === 0 ? 
                (team === this.matchData.team1 ? this.matchData.team2 : this.matchData.team1) : 
                (team === this.matchData.team2 ? this.matchData.team1 : this.matchData.team2);
            
            scorecardHTML += `
                <div class="bowling-card">
                    <h3>${bowlingTeam.name} Bowling</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Bowler</th>
                                <th>Overs</th>
                                <th>Maidens</th>
                                <th>Runs</th>
                                <th>Wickets</th>
                                <th>Economy</th>
                            </tr>
                        </thead>
                        <tbody>`;
            
            bowlingTeam.bowling.forEach((bowler, bowlerIndex) => {
                if (bowler.overs > 0 || bowler.balls > 0) {
                    const totalOvers = bowler.overs + bowler.balls/6;
                    const economy = totalOvers > 0 ? (bowler.runs / totalOvers).toFixed(2) : '0.00';
                    const teamIndex = bowlingTeam === this.matchData.team1 ? 1 : 2;
                    scorecardHTML += `
                        <tr>
                            <td>
                                <div class="player-name-container">
                                    <span class="bowler-name-display" id="bowlerDisplay_${teamIndex}_${bowlerIndex}"
                                          ondblclick="cricketMatch.editBowlerName(${teamIndex}, ${bowlerIndex})"
                                          title="Double-click to edit">${bowler.name}</span>
                                    <input type="text" class="bowler-name-edit" id="bowlerEdit_${teamIndex}_${bowlerIndex}" 
                                           value="${bowler.name}" style="display:none;" 
                                           onblur="cricketMatch.saveBowlerName(${teamIndex}, ${bowlerIndex})"
                                           onkeypress="if(event.key==='Enter') cricketMatch.saveBowlerName(${teamIndex}, ${bowlerIndex})">
                                    <button class="edit-btn" onclick="cricketMatch.editBowlerName(${teamIndex}, ${bowlerIndex})" title="Edit name">✏️</button>
                                </div>
                            </td>
                            <td>${bowler.overs}.${bowler.balls}</td>
                            <td>${bowler.maidens}</td>
                            <td>${bowler.runs}</td>
                            <td>${bowler.wickets}</td>
                            <td>${economy}</td>
                        </tr>`;
                }
            });
            
            scorecardHTML += `
                        </tbody>
                    </table>
                </div>`;
        });
        
        document.getElementById('scorecardContent').innerHTML = scorecardHTML;
        
        if (this.matchData.matchStatus === 'completed') {
            this.calculateMatchAwards();
        }
    }

    backToScoring() {
        if (this.matchData.matchStatus === 'live') {
            document.getElementById('scorecardSection').style.display = 'none';
            document.getElementById('scoringSection').style.display = 'block';
        }
    }

    saveMatch() {
        // Clear active match when saving to history
        this.clearActiveMatch();
        
        const matches = JSON.parse(localStorage.getItem('cricketMatches') || '[]');
        const matchSummary = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            team1: this.matchData.team1.name,
            team2: this.matchData.team2.name,
            team1Score: `${this.matchData.team1.runs}/${this.matchData.team1.wickets}`,
            team2Score: `${this.matchData.team2.runs}/${this.matchData.team2.wickets}`,
            result: this.getMatchResult(),
            fullData: this.matchData
        };
        
        matches.push(matchSummary);
        localStorage.setItem('cricketMatches', JSON.stringify(matches));
        alert('Match saved successfully!');
    }

    getMatchResult() {
        if (this.matchData.matchStatus !== 'completed') return 'In Progress';
        
        // If we have a stored result, use it
        if (this.matchData.result) {
            return this.matchData.result;
        }
        
        // Otherwise calculate it
        if (this.matchData.currentInnings === 2) {
            if (this.matchData.battingTeam.runs >= this.matchData.target) {
                return `${this.matchData.battingTeam.name} won by ${10 - this.matchData.battingTeam.wickets} wickets`;
            } else {
                return `${this.matchData.bowlingTeam.name} won by ${this.matchData.target - this.matchData.battingTeam.runs - 1} runs`;
            }
        }
        return 'Match drawn';
    }

    shareScorecard() {
        const scoreText = this.generateShareText();
        
        if (navigator.share) {
            navigator.share({
                title: 'Cricket Match Scorecard',
                text: scoreText
            }).catch(err => console.log('Error sharing:', err));
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(scoreText).then(() => {
                alert('Scorecard copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy:', err);
                // Fallback for older browsers
                this.fallbackCopyToClipboard(scoreText);
            });
        } else {
            // Fallback for older browsers
            this.fallbackCopyToClipboard(scoreText);
        }
    }
    
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            alert('Scorecard copied to clipboard!');
        } catch (err) {
            alert('Failed to copy to clipboard. Please copy manually.');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    generateShareText() {
        let text = `Cricket Match: ${this.matchData.team1.name} vs ${this.matchData.team2.name}\n\n`;
        text += `${this.matchData.team1.name}: ${this.matchData.team1.runs}/${this.matchData.team1.wickets} (${this.matchData.team1.overs}.${this.matchData.team1.balls})\n`;
        text += `${this.matchData.team2.name}: ${this.matchData.team2.runs}/${this.matchData.team2.wickets} (${this.matchData.team2.overs}.${this.matchData.team2.balls})\n\n`;
        text += `Result: ${this.getMatchResult()}`;
        return text;
    }

    showBowlerSelection() {
        const bowlerSelect = document.getElementById('bowlerSelect');
        const selectBtn = document.getElementById('selectBowlerBtn');
        
        bowlerSelect.innerHTML = '<option value="">Choose Bowler</option>';
        
        this.matchData.bowlingTeam.bowling.forEach((bowler, index) => {
            // Prevent same bowler from bowling consecutive overs
            if (bowler.available && bowler !== this.matchData.previousBowler) {
                bowlerSelect.innerHTML += `<option value="${index}">${bowler.name} (${bowler.overs}.${bowler.balls}-${bowler.maidens}-${bowler.runs}-${bowler.wickets})</option>`;
            }
        });
        
        selectBtn.style.display = 'none';
        bowlerSelect.style.display = 'block';
    }

    changeBowler(bowlerIndex) {
        if (bowlerIndex === '') return;
        
        const index = parseInt(bowlerIndex);
        this.matchData.currentBowler = this.matchData.bowlingTeam.bowling[index];
        
        document.getElementById('bowlerSelect').style.display = 'none';
        document.getElementById('selectBowlerBtn').style.display = 'block';
        document.getElementById('bowlerSelect').value = '';
        
        this.updateDisplay();
    }
    
    changeBatsmanPosition(position) {
        // Store which position we're changing
        this.changingPosition = position;
        
        const changeSelect = document.getElementById('batterChangeSelect');
        changeSelect.innerHTML = '<option value="">Choose Replacement Batter</option>';
        changeSelect.innerHTML += '<option value="cancel">Cancel</option>';
        
        // Get current batsman to exclude from list
        const currentBatsman = this.matchData.currentBatsmen[position];
        const otherPosition = position === 'striker' ? 'nonStriker' : 'striker';
        const otherBatsman = this.matchData.currentBatsmen[otherPosition];
        
        // Add available batsmen to dropdown
        this.matchData.battingTeam.batting.forEach((batsman, index) => {
            // Only show batsmen who are not out and not the other current batsman
            if (!batsman.out && batsman !== otherBatsman) {
                const selected = batsman === currentBatsman ? ' (current)' : '';
                changeSelect.innerHTML += `<option value="${index}">${batsman.name}${selected}</option>`;
            }
        });
        
        // Hide other elements and show change select
        document.getElementById('selectBatterBtn').style.display = 'none';
        document.getElementById('batterSelect').style.display = 'none';
        changeSelect.style.display = 'block';
        
        // Add event listener for this change
        changeSelect.onchange = (e) => {
            this.confirmBatsmanChange(e.target.value);
            changeSelect.onchange = null; // Remove the event listener after use
        };
    }
    
    confirmBatsmanChange(batterIndex) {
        if (batterIndex === '') return;
        
        // Handle cancel
        if (batterIndex === 'cancel') {
            document.getElementById('batterChangeSelect').style.display = 'none';
            document.getElementById('batterChangeSelect').value = '';
            return;
        }
        
        const index = parseInt(batterIndex);
        const newBatsman = this.matchData.battingTeam.batting[index];
        const position = this.changingPosition;
        const oldBatsman = this.matchData.currentBatsmen[position];
        
        // If selecting the same batsman, just hide the dropdown
        if (newBatsman === oldBatsman) {
            document.getElementById('batterChangeSelect').style.display = 'none';
            document.getElementById('batterChangeSelect').value = '';
            return;
        }
        
        // Transfer runs and balls to the new batsman
        newBatsman.runs = oldBatsman.runs;
        newBatsman.balls = oldBatsman.balls;
        newBatsman.fours = oldBatsman.fours;
        newBatsman.sixes = oldBatsman.sixes;
        
        // Reset old batsman stats (as they haven't actually batted)
        oldBatsman.runs = 0;
        oldBatsman.balls = 0;
        oldBatsman.fours = 0;
        oldBatsman.sixes = 0;
        
        // Update current batsman
        this.matchData.currentBatsmen[position] = newBatsman;
        
        // Hide dropdown and update display
        document.getElementById('batterChangeSelect').style.display = 'none';
        document.getElementById('batterChangeSelect').value = '';
        
        this.updateDisplay();
        
        // Save the change
        if (this.matchData.matchStatus === 'live') {
            this.saveActiveMatch();
        }
    }
    
    showBatterSelection() {
        const batterSelect = document.getElementById('batterSelect');
        const selectBtn = document.getElementById('selectBatterBtn');
        const changeSelect = document.getElementById('batterChangeSelect');
        
        // Make sure change select is hidden
        changeSelect.style.display = 'none';
        changeSelect.value = '';
        
        // Check if we're selecting opening batsmen
        const isOpeningSelection = !this.matchData.currentBatsmen.striker || !this.matchData.currentBatsmen.nonStriker;
        
        if (isOpeningSelection && !this.matchData.currentBatsmen.striker) {
            batterSelect.innerHTML = '<option value="">Choose Opening Batsman (Striker)</option>';
        } else if (isOpeningSelection && !this.matchData.currentBatsmen.nonStriker) {
            batterSelect.innerHTML = '<option value="">Choose Opening Batsman (Non-Striker)</option>';
        } else {
            batterSelect.innerHTML = '<option value="">Choose Next Batsman</option>';
        }
        
        // Add available batsmen to dropdown
        this.matchData.battingTeam.batting.forEach((batsman, index) => {
            // Only show batsmen who are not out and not currently batting
            if (!batsman.out && 
                batsman !== this.matchData.currentBatsmen.striker && 
                batsman !== this.matchData.currentBatsmen.nonStriker) {
                batterSelect.innerHTML += `<option value="${index}">${batsman.name}</option>`;
            }
        });
        
        selectBtn.style.display = 'none';
        batterSelect.style.display = 'block';
        batterSelect.focus(); // Focus on the dropdown for better UX
    }
    
    changeBatter(batterIndex) {
        if (batterIndex === '') return;
        
        const index = parseInt(batterIndex);
        const selectBtn = document.getElementById('selectBatterBtn');
        const batterSelect = document.getElementById('batterSelect');
        
        // Check if we're selecting opening batsmen
        if (!this.matchData.currentBatsmen.striker) {
            this.matchData.currentBatsmen.striker = this.matchData.battingTeam.batting[index];
            batterSelect.style.display = 'none';
            batterSelect.value = '';
            
            // Need to select non-striker next
            selectBtn.textContent = 'Select Non-Striker';
            selectBtn.style.display = 'block';
            
            // Make sure the correct dropdown is hidden
            batterSelect.style.display = 'none';
            document.getElementById('batterChangeSelect').style.display = 'none';
            
            this.updateDisplay();
            return;
        } else if (!this.matchData.currentBatsmen.nonStriker) {
            this.matchData.currentBatsmen.nonStriker = this.matchData.battingTeam.batting[index];
            selectBtn.textContent = 'Select Batter';
            selectBtn.style.display = 'none'; // Hide the button after selecting non-striker
            
            // Both openers selected, enable scoring
            document.querySelectorAll('.run-btn, .extra-btn, #wicketBtn').forEach(btn => {
                btn.disabled = false;
            });
        } else {
            // Regular wicket replacement
            this.matchData.currentBatsmen.striker = this.matchData.battingTeam.batting[index];
            
            // Re-enable scoring buttons
            document.querySelectorAll('.run-btn, .extra-btn, #wicketBtn').forEach(btn => {
                btn.disabled = false;
            });
        }
        
        batterSelect.style.display = 'none';
        batterSelect.value = '';
        this.updateDisplay();
    }

    navigateTo(section) {
        const sections = ['matchSetup', 'scoringSection', 'scorecardSection', 'historySection'];
        sections.forEach(sec => {
            document.getElementById(sec).style.display = 'none';
        });
        
        switch(section) {
            case 'setup':
                document.getElementById('matchSetup').style.display = 'block';
                break;
            case 'scoring':
                if (this.matchData.matchStatus === 'live') {
                    document.getElementById('scoringSection').style.display = 'block';
                } else {
                    alert('No active match. Please start a new match.');
                    this.navigateTo('setup');
                    return;
                }
                break;
            case 'scorecard':
                if (this.matchData.matchStatus !== 'setup') {
                    this.showScorecard();
                } else {
                    alert('No match data available. Please start a match first.');
                    return;
                }
                break;
            case 'history':
                document.getElementById('historySection').style.display = 'block';
                this.loadMatchHistory();
                break;
        }
        
        this.updateNavigation(section);
    }

    updateNavigation(activeSection) {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => btn.classList.remove('active'));
        
        const sectionMap = {
            'setup': 'navSetup',
            'scoring': 'navScoring',
            'scorecard': 'navScorecard',
            'history': 'navHistory'
        };
        
        if (sectionMap[activeSection]) {
            document.getElementById(sectionMap[activeSection]).classList.add('active');
        }
    }

    startNewMatch() {
        if (this.matchData.matchStatus === 'live') {
            if (!confirm('Current match will be lost. Continue?')) {
                return;
            }
        }
        
        location.reload();
    }

    loadMatchHistory() {
        const matches = JSON.parse(localStorage.getItem('cricketMatches') || '[]');
        const historyDiv = document.getElementById('matchHistory');
        
        if (matches.length === 0) {
            historyDiv.innerHTML = '<p>No saved matches yet. Complete and save a match to see it here.</p>';
            return;
        }
        
        let historyHTML = '';
        matches.forEach((match, index) => {
            const winner = match.fullData?.winner || '';
            const team1Won = winner === match.team1;
            const team2Won = winner === match.team2;
            
            historyHTML += `
                <div class="match-history-item">
                    <h4>${match.team1} ${team1Won ? '🏆' : ''} vs ${match.team2} ${team2Won ? '🏆' : ''}</h4>
                    <p>Date: ${match.date}</p>
                    <p class="${team1Won ? 'winning-team-text' : ''}">${match.team1}: ${match.team1Score}</p>
                    <p class="${team2Won ? 'winning-team-text' : ''}">${match.team2}: ${match.team2Score}</p>
                    <p><strong>Result: ${match.result}</strong></p>
                    <button class="btn btn-secondary load-match" onclick="cricketMatch.loadMatch(${index})">Load Match</button>
                </div>
            `;
        });
        
        historyDiv.innerHTML = historyHTML;
    }

    loadMatch(index) {
        const matches = JSON.parse(localStorage.getItem('cricketMatches') || '[]');
        if (matches[index]) {
            this.matchData = matches[index].fullData;
            this.matchData.matchStatus = 'completed';
            
            // Ensure extras object exists for older saved matches
            if (!this.matchData.team1.extras) {
                this.matchData.team1.extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 };
            }
            if (!this.matchData.team2.extras) {
                this.matchData.team2.extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 };
            }
            
            this.showScorecard();
            document.getElementById('navigation').style.display = 'flex';
        }
    }

    calculateMatchAwards() {
        let bestBatter = null;
        let bestBowler = null;
        let bestBatterScore = 0;
        let bestBowlerWickets = 0;
        let bestBowlerEconomy = 999;
        
        const allBatsmen = [...this.matchData.team1.batting, ...this.matchData.team2.batting];
        allBatsmen.forEach(batsman => {
            if (batsman.runs > bestBatterScore) {
                bestBatterScore = batsman.runs;
                bestBatter = batsman;
            }
        });
        
        const allBowlers = [...this.matchData.team1.bowling, ...this.matchData.team2.bowling];
        allBowlers.forEach(bowler => {
            if (bowler.overs > 0 || bowler.balls > 0) {
                const totalOvers = bowler.overs + bowler.balls/6;
                const economy = bowler.runs / totalOvers;
                
                if (bowler.wickets > bestBowlerWickets || 
                    (bowler.wickets === bestBowlerWickets && economy < bestBowlerEconomy)) {
                    bestBowlerWickets = bowler.wickets;
                    bestBowlerEconomy = economy;
                    bestBowler = bowler;
                }
            }
        });
        
        if (bestBatter) {
            const strikeRate = bestBatter.balls > 0 ? (bestBatter.runs * 100 / bestBatter.balls).toFixed(2) : '0.00';
            document.getElementById('bestBatter').textContent = bestBatter.name;
            document.getElementById('bestBatterStats').textContent = `${bestBatter.runs} runs (${bestBatter.balls} balls) - SR: ${strikeRate}`;
        }
        
        if (bestBowler) {
            document.getElementById('bestBowler').textContent = bestBowler.name;
            document.getElementById('bestBowlerStats').textContent = `${bestBowler.wickets}/${bestBowler.runs} (${bestBowler.overs}.${bestBowler.balls} overs)`;
        }
        
        let manOfMatch = bestBatter;
        let momReason = 'Outstanding batting performance';
        
        if (bestBowler && bestBowler.wickets >= 3) {
            manOfMatch = bestBowler;
            momReason = 'Excellent bowling figures';
        } else if (bestBatter && bestBatter.runs >= 50) {
            manOfMatch = bestBatter;
            momReason = 'Match-winning innings';
        }
        
        if (manOfMatch) {
            document.getElementById('manOfMatch').textContent = manOfMatch.name;
            document.getElementById('manOfMatchReason').textContent = momReason;
        }
        
        this.updateSeriesStats();
    }

    saveBallState() {
        // Deep clone the current state
        const state = {
            battingTeam: JSON.parse(JSON.stringify(this.matchData.battingTeam)),
            bowlingTeam: JSON.parse(JSON.stringify(this.matchData.bowlingTeam)),
            currentBatsmen: JSON.parse(JSON.stringify(this.matchData.currentBatsmen)),
            currentBowler: JSON.parse(JSON.stringify(this.matchData.currentBowler)),
            previousBowler: JSON.parse(JSON.stringify(this.matchData.previousBowler)),
            thisOver: [...this.matchData.thisOver],
            currentInnings: this.matchData.currentInnings,
            matchStatus: this.matchData.matchStatus
        };
        
        // Limit history to last 10 balls to prevent memory issues
        if (this.matchData.ballHistory.length >= 10) {
            this.matchData.ballHistory.shift();
        }
        
        this.matchData.ballHistory.push(state);
    }
    
    undoLastBall() {
        if (this.matchData.ballHistory.length === 0) {
            alert('No balls to undo');
            return;
        }
        
        if (this.matchData.matchStatus !== 'live') {
            alert('Cannot undo after match has ended');
            return;
        }
        
        const lastState = this.matchData.ballHistory.pop();
        
        // Restore the state
        this.matchData.battingTeam = lastState.battingTeam;
        this.matchData.bowlingTeam = lastState.bowlingTeam;
        this.matchData.currentBatsmen = lastState.currentBatsmen;
        this.matchData.currentBowler = lastState.currentBowler;
        this.matchData.previousBowler = lastState.previousBowler;
        this.matchData.thisOver = lastState.thisOver;
        this.matchData.currentInnings = lastState.currentInnings;
        this.matchData.matchStatus = lastState.matchStatus;
        
        // Update the display
        this.updateDisplay();
        
        alert('Last ball has been undone');
    }
    
    updateSeriesStats() {
        const matches = JSON.parse(localStorage.getItem('cricketMatches') || '[]');
        if (matches.length >= 2) {
            document.getElementById('seriesAwards').style.display = 'block';
            
            const playerStats = {};
            
            matches.forEach(match => {
                if (match.fullData) {
                    const allBatsmen = [...match.fullData.team1.batting, ...match.fullData.team2.batting];
                    const allBowlers = [...match.fullData.team1.bowling, ...match.fullData.team2.bowling];
                    
                    allBatsmen.forEach(batsman => {
                        if (!playerStats[batsman.name]) {
                            playerStats[batsman.name] = { runs: 0, wickets: 0, matches: 0 };
                        }
                        playerStats[batsman.name].runs += batsman.runs;
                        playerStats[batsman.name].matches += 1;
                    });
                    
                    allBowlers.forEach(bowler => {
                        if (bowler.wickets > 0) {
                            if (!playerStats[bowler.name]) {
                                playerStats[bowler.name] = { runs: 0, wickets: 0, matches: 0 };
                            }
                            playerStats[bowler.name].wickets += bowler.wickets;
                        }
                    });
                }
            });
            
            let topScorer = null;
            let topWicketTaker = null;
            let maxRuns = 0;
            let maxWickets = 0;
            
            Object.entries(playerStats).forEach(([player, stats]) => {
                if (stats.runs > maxRuns) {
                    maxRuns = stats.runs;
                    topScorer = { name: player, stats: stats };
                }
                if (stats.wickets > maxWickets) {
                    maxWickets = stats.wickets;
                    topWicketTaker = { name: player, stats: stats };
                }
            });
            
            if (topScorer) {
                document.getElementById('leadingRunScorer').textContent = topScorer.name;
                document.getElementById('leadingRunScorerStats').textContent = `${topScorer.stats.runs} runs in ${topScorer.stats.matches} matches`;
                document.getElementById('manOfSeries').textContent = topScorer.name;
                document.getElementById('manOfSeriesStats').textContent = 'Top performer across all matches';
            }
            
            if (topWicketTaker) {
                document.getElementById('leadingWicketTaker').textContent = topWicketTaker.name;
                document.getElementById('leadingWicketTakerStats').textContent = `${topWicketTaker.stats.wickets} wickets`;
            }
        }
    }
    
    saveActiveMatch() {
        if (this.matchData.matchStatus === 'live') {
            localStorage.setItem('activeMatch', JSON.stringify(this.matchData));
        }
    }
    
    loadActiveMatch() {
        const savedMatch = localStorage.getItem('activeMatch');
        if (savedMatch) {
            try {
                const matchData = JSON.parse(savedMatch);
                if (matchData.matchStatus === 'live') {
                    if (confirm('An active match was found. Do you want to continue it?')) {
                        this.matchData = matchData;
                        
                        // Restore object references for batting and bowling teams
                        if (matchData.battingTeam.name === matchData.team1.name) {
                            this.matchData.battingTeam = this.matchData.team1;
                            this.matchData.bowlingTeam = this.matchData.team2;
                        } else {
                            this.matchData.battingTeam = this.matchData.team2;
                            this.matchData.bowlingTeam = this.matchData.team1;
                        }
                        
                        // Navigate to scoring section
                        setTimeout(() => {
                            document.getElementById('matchSetup').style.display = 'none';
                            document.getElementById('scoringSection').style.display = 'block';
                            document.getElementById('navigation').style.display = 'flex';
                            this.updateDisplay();
                            this.updateNavigation('scoring');
                        }, 100);
                    } else {
                        localStorage.removeItem('activeMatch');
                    }
                }
            } catch (e) {
                console.error('Error loading active match:', e);
                localStorage.removeItem('activeMatch');
            }
        }
    }
    
    clearActiveMatch() {
        localStorage.removeItem('activeMatch');
    }
    
    editBatsmanName(teamIndex, batsmanIndex) {
        const displaySpan = document.getElementById(`batsmanDisplay_${teamIndex}_${batsmanIndex}`);
        const editInput = document.getElementById(`batsmanEdit_${teamIndex}_${batsmanIndex}`);
        
        if (displaySpan && editInput) {
            // Store the current selection if any
            const selection = window.getSelection();
            const selectedText = selection.toString();
            
            // If user has selected text, don't enter edit mode
            if (selectedText && displaySpan.textContent.includes(selectedText)) {
                return;
            }
            
            displaySpan.style.display = 'none';
            editInput.style.display = 'inline-block';
            editInput.focus();
            editInput.select();
        }
    }
    
    saveBatsmanName(teamIndex, batsmanIndex) {
        const displaySpan = document.getElementById(`batsmanDisplay_${teamIndex}_${batsmanIndex}`);
        const editInput = document.getElementById(`batsmanEdit_${teamIndex}_${batsmanIndex}`);
        
        if (displaySpan && editInput) {
            const newName = editInput.value.trim();
            if (newName) {
                // Update the data model
                const team = teamIndex === 1 ? this.matchData.team1 : this.matchData.team2;
                team.batting[batsmanIndex].name = newName;
                
                // Update display
                displaySpan.textContent = newName;
                displaySpan.style.display = 'inline';
                editInput.style.display = 'none';
                
                // Save the updated match data if it's a saved match
                if (this.matchData.matchStatus === 'completed') {
                    // Update in localStorage if this match is saved
                    const matches = JSON.parse(localStorage.getItem('cricketMatches') || '[]');
                    const matchIndex = matches.findIndex(m => 
                        m.date === this.matchData.date && 
                        m.team1 === this.matchData.team1.name && 
                        m.team2 === this.matchData.team2.name
                    );
                    
                    if (matchIndex !== -1) {
                        matches[matchIndex].fullData = this.matchData;
                        localStorage.setItem('cricketMatches', JSON.stringify(matches));
                    }
                } else if (this.matchData.matchStatus === 'live') {
                    // Save active match
                    this.saveActiveMatch();
                }
                
                // Update awards display if visible
                this.calculateMatchAwards();
            } else {
                // Revert to original name if empty
                editInput.value = displaySpan.textContent;
                displaySpan.style.display = 'inline';
                editInput.style.display = 'none';
            }
        }
    }
    
    editBowlerName(teamIndex, bowlerIndex) {
        const displaySpan = document.getElementById(`bowlerDisplay_${teamIndex}_${bowlerIndex}`);
        const editInput = document.getElementById(`bowlerEdit_${teamIndex}_${bowlerIndex}`);
        
        if (displaySpan && editInput) {
            // Store the current selection if any
            const selection = window.getSelection();
            const selectedText = selection.toString();
            
            // If user has selected text, don't enter edit mode
            if (selectedText && displaySpan.textContent.includes(selectedText)) {
                return;
            }
            
            displaySpan.style.display = 'none';
            editInput.style.display = 'inline-block';
            editInput.focus();
            editInput.select();
        }
    }
    
    saveBowlerName(teamIndex, bowlerIndex) {
        const displaySpan = document.getElementById(`bowlerDisplay_${teamIndex}_${bowlerIndex}`);
        const editInput = document.getElementById(`bowlerEdit_${teamIndex}_${bowlerIndex}`);
        
        if (displaySpan && editInput) {
            const newName = editInput.value.trim();
            if (newName) {
                // Update the data model
                const team = teamIndex === 1 ? this.matchData.team1 : this.matchData.team2;
                team.bowling[bowlerIndex].name = newName;
                
                // Update display
                displaySpan.textContent = newName;
                displaySpan.style.display = 'inline';
                editInput.style.display = 'none';
                
                // Save the updated match data if it's a saved match
                if (this.matchData.matchStatus === 'completed') {
                    // Update in localStorage if this match is saved
                    const matches = JSON.parse(localStorage.getItem('cricketMatches') || '[]');
                    const matchIndex = matches.findIndex(m => 
                        m.date === this.matchData.date && 
                        m.team1 === this.matchData.team1.name && 
                        m.team2 === this.matchData.team2.name
                    );
                    
                    if (matchIndex !== -1) {
                        matches[matchIndex].fullData = this.matchData;
                        localStorage.setItem('cricketMatches', JSON.stringify(matches));
                    }
                } else if (this.matchData.matchStatus === 'live') {
                    // Save active match
                    this.saveActiveMatch();
                }
                
                // Update awards display if visible
                this.calculateMatchAwards();
            } else {
                // Revert to original name if empty
                editInput.value = displaySpan.textContent;
                displaySpan.style.display = 'inline';
                editInput.style.display = 'none';
            }
        }
    }
    
    updateTournamentMatch() {
        // Send match data back to tournament
        const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
        const tournament = tournaments.find(t => t.id === this.matchData.tournamentId);
        
        if (tournament) {
            const match = tournament.matches.find(m => m.id === this.matchData.tournamentMatchId);
            if (match) {
                match.status = 'completed';
                match.result = {
                    winner: this.matchData.winner,
                    margin: this.matchData.result,
                    team1Score: {
                        runs: this.matchData.team1.runs,
                        wickets: this.matchData.team1.wickets,
                        overs: this.matchData.team1.overs,
                        balls: this.matchData.team1.balls
                    },
                    team2Score: {
                        runs: this.matchData.team2.runs,
                        wickets: this.matchData.team2.wickets,
                        overs: this.matchData.team2.overs,
                        balls: this.matchData.team2.balls
                    }
                };
                match.scorecard = this.matchData;
                
                // Save updated tournament
                localStorage.setItem('tournaments', JSON.stringify(tournaments));
                
                // Offer to return to tournament
                setTimeout(() => {
                    if (confirm('Return to tournament dashboard?')) {
                        window.location.href = 'tournament.html';
                    }
                }, 2000);
            }
        }
    }
}

const cricketMatch = new CricketMatch();
document.addEventListener('DOMContentLoaded', () => {
    window.cricketMatch = cricketMatch;
});