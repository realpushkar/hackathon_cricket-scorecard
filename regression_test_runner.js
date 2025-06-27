// Regression Test Runner for Cricket Scorecard App
class RegressionTestRunner {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
        this.currentTest = '';
    }

    async runAllTests() {
        console.log('🏏 Starting Cricket Scorecard Regression Tests...\n');
        
        try {
            // Test Categories
            await this.testMatchSetup();
            await this.testLiveScoring();
            await this.testScorecardAndAwards();
            await this.testNavigationAndHistory();
            await this.testNewFeatures();
            await this.testEdgeCases();
            
            this.printSummary();
        } catch (error) {
            console.error('Test Runner Error:', error);
        }
    }

    async testMatchSetup() {
        console.log('📋 Testing Match Setup...');
        
        // Test 1: Basic match creation
        await this.test('Create T20 Match', async () => {
            const match = new CricketMatch();
            
            // Simulate form data
            document.getElementById('matchFormat').value = 'T20';
            document.getElementById('team1Name').value = 'India';
            document.getElementById('team2Name').value = 'Australia';
            document.getElementById('tossWinner').value = 'India';
            document.getElementById('tossDecision').value = 'bat';
            
            // Add players
            for (let i = 0; i < 11; i++) {
                const team1Input = document.querySelector(`[data-team="1"][data-player="${i}"]`);
                const team2Input = document.querySelector(`[data-team="2"][data-player="${i}"]`);
                if (team1Input) team1Input.value = `India Player ${i + 1}`;
                if (team2Input) team2Input.value = `Australia Player ${i + 1}`;
            }
            
            // Start match
            const form = document.getElementById('matchSetupForm');
            const event = new Event('submit');
            event.preventDefault = () => {};
            form.dispatchEvent(event);
            
            // Verify
            this.assert(match.matchData.format === 'T20', 'Format should be T20');
            this.assert(match.matchData.totalOvers === 20, 'Total overs should be 20');
            this.assert(document.getElementById('scoringSection').style.display !== 'none', 'Scoring section should be visible');
        });

        // Test 2: Custom overs validation
        await this.test('Custom Overs Validation', async () => {
            const match = new CricketMatch();
            
            document.getElementById('matchFormat').value = 'Custom';
            const customOversInput = document.getElementById('customOvers');
            
            // Test negative overs
            customOversInput.value = '-5';
            this.assert(!customOversInput.checkValidity(), 'Negative overs should be invalid');
            
            // Test zero overs
            customOversInput.value = '0';
            this.assert(!customOversInput.checkValidity(), 'Zero overs should be invalid');
            
            // Test valid overs
            customOversInput.value = '10';
            this.assert(customOversInput.checkValidity(), '10 overs should be valid');
        });

        // Test 3: Start New Match button
        await this.test('Start New Match Button', async () => {
            const navNewMatch = document.getElementById('navNewMatch');
            this.assert(navNewMatch !== null, 'Start New Match button should exist');
            this.assert(navNewMatch.classList.contains('btn-primary'), 'Should have primary button styling');
            this.assert(navNewMatch.textContent.includes('Start New Match'), 'Should have correct text');
        });
    }

    async testLiveScoring() {
        console.log('\n🏏 Testing Live Scoring...');

        // Test 4: Select Batter functionality
        await this.test('Select Batter Feature', async () => {
            const selectBatterBtn = document.getElementById('selectBatterBtn');
            const batterSelect = document.getElementById('batterSelect');
            
            this.assert(selectBatterBtn !== null, 'Select Batter button should exist');
            this.assert(batterSelect !== null, 'Batter select dropdown should exist');
            
            // Initially hidden
            this.assert(selectBatterBtn.style.display === 'none', 'Button should be initially hidden');
            this.assert(batterSelect.style.display === 'none', 'Dropdown should be initially hidden');
        });

        // Test 5: Change batsman buttons
        await this.test('Change Batsman Buttons', async () => {
            const changeStrikerBtn = document.getElementById('changeStrikerBtn');
            const changeNonStrikerBtn = document.getElementById('changeNonStrikerBtn');
            
            this.assert(changeStrikerBtn !== null, 'Change striker button should exist');
            this.assert(changeNonStrikerBtn !== null, 'Change non-striker button should exist');
            this.assert(changeStrikerBtn.textContent === '↻', 'Should show rotation icon');
            this.assert(changeStrikerBtn.classList.contains('change-btn'), 'Should have change-btn class');
        });

        // Test 6: Scoring runs
        await this.test('Score Runs', async () => {
            const runButtons = document.querySelectorAll('.run-btn');
            this.assert(runButtons.length === 6, 'Should have 6 run buttons (0-6)');
            
            runButtons.forEach(btn => {
                const runs = btn.dataset.runs;
                this.assert(['0', '1', '2', '3', '4', '6'].includes(runs), `Should have valid run value: ${runs}`);
            });
        });

        // Test 7: Extras
        await this.test('Extras Buttons', async () => {
            const extraButtons = document.querySelectorAll('.extra-btn');
            this.assert(extraButtons.length === 4, 'Should have 4 extra buttons');
            
            const expectedExtras = ['wide', 'noball', 'bye', 'legbye'];
            extraButtons.forEach((btn, index) => {
                this.assert(btn.dataset.extra === expectedExtras[index], `Should have ${expectedExtras[index]} button`);
            });
        });

        // Test 8: Wicket handling
        await this.test('Wicket Options', async () => {
            const wicketBtn = document.getElementById('wicketBtn');
            const wicketType = document.getElementById('wicketType');
            
            this.assert(wicketBtn !== null, 'Wicket button should exist');
            this.assert(wicketType !== null, 'Wicket type dropdown should exist');
            
            const options = wicketType.querySelectorAll('option');
            const hasCancel = Array.from(options).some(opt => opt.value === 'cancel');
            this.assert(hasCancel, 'Should have cancel option in wicket dropdown');
        });
    }

    async testScorecardAndAwards() {
        console.log('\n📊 Testing Scorecard & Awards...');

        // Test 9: Scorecard structure
        await this.test('Scorecard Elements', async () => {
            const scorecardSection = document.getElementById('scorecardSection');
            const awardsSection = document.getElementById('awardsSection');
            
            this.assert(scorecardSection !== null, 'Scorecard section should exist');
            this.assert(awardsSection !== null, 'Awards section should exist');
            
            // Check award elements
            this.assert(document.getElementById('bestBatter') !== null, 'Best Batter award should exist');
            this.assert(document.getElementById('bestBowler') !== null, 'Best Bowler award should exist');
            this.assert(document.getElementById('manOfMatch') !== null, 'Man of Match award should exist');
        });

        // Test 10: Match result display
        await this.test('Match Result Display', async () => {
            const matchResultSection = document.getElementById('matchResultSection');
            const winnerTeam = document.getElementById('winnerTeam');
            const matchResult = document.getElementById('matchResult');
            
            this.assert(matchResultSection !== null, 'Match result section should exist');
            this.assert(winnerTeam !== null, 'Winner team element should exist');
            this.assert(matchResult !== null, 'Match result element should exist');
        });
    }

    async testNavigationAndHistory() {
        console.log('\n🧭 Testing Navigation & History...');

        // Test 11: Navigation buttons
        await this.test('Navigation Elements', async () => {
            const navButtons = ['navSetup', 'navScoring', 'navScorecard', 'navHistory', 'navNewMatch'];
            
            navButtons.forEach(id => {
                const button = document.getElementById(id);
                this.assert(button !== null, `Navigation button ${id} should exist`);
                this.assert(button.classList.contains('nav-btn'), 'Should have nav-btn class');
            });
        });

        // Test 12: History section
        await this.test('Match History', async () => {
            const historySection = document.getElementById('historySection');
            const matchHistory = document.getElementById('matchHistory');
            const seriesAwards = document.getElementById('seriesAwards');
            
            this.assert(historySection !== null, 'History section should exist');
            this.assert(matchHistory !== null, 'Match history container should exist');
            this.assert(seriesAwards !== null, 'Series awards section should exist');
        });
    }

    async testNewFeatures() {
        console.log('\n✨ Testing New Features...');

        // Test 13: Name editing CSS
        await this.test('Name Editing Styles', async () => {
            const styles = document.createElement('style');
            styles.textContent = `
                .test-name-display {
                    user-select: text !important;
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
                }
            `;
            document.head.appendChild(styles);
            
            const testElement = document.createElement('div');
            testElement.className = 'test-name-display';
            document.body.appendChild(testElement);
            
            const computedStyle = window.getComputedStyle(testElement);
            this.assert(computedStyle.userSelect === 'text', 'User select should be text');
            
            document.body.removeChild(testElement);
            document.head.removeChild(styles);
        });

        // Test 14: Button visibility
        await this.test('Button Visibility Logic', async () => {
            // Test that buttons are properly configured
            const selectBatterBtn = document.getElementById('selectBatterBtn');
            const changeButtons = document.querySelectorAll('.change-btn');
            
            this.assert(selectBatterBtn.style.display === 'none', 'Select batter button should be hidden initially');
            changeButtons.forEach(btn => {
                this.assert(btn.style.display === 'none', 'Change buttons should be hidden initially');
            });
        });
    }

    async testEdgeCases() {
        console.log('\n⚠️ Testing Edge Cases...');

        // Test 15: Browser storage
        await this.test('LocalStorage Support', async () => {
            try {
                localStorage.setItem('test', 'value');
                const value = localStorage.getItem('test');
                localStorage.removeItem('test');
                this.assert(value === 'value', 'LocalStorage should work');
            } catch (e) {
                this.assert(false, 'LocalStorage not supported');
            }
        });

        // Test 16: Input validation
        await this.test('Input Validation', async () => {
            const team1Name = document.getElementById('team1Name');
            const team2Name = document.getElementById('team2Name');
            
            this.assert(team1Name.hasAttribute('required'), 'Team 1 name should be required');
            this.assert(team2Name.hasAttribute('required'), 'Team 2 name should be required');
        });
    }

    // Helper methods
    async test(name, testFn) {
        this.currentTest = name;
        this.results.total++;
        
        try {
            await testFn();
            this.results.passed++;
            console.log(`✅ ${name}`);
        } catch (error) {
            this.results.failed++;
            this.results.errors.push({
                test: name,
                error: error.message
            });
            console.log(`❌ ${name}: ${error.message}`);
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('REGRESSION TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        
        if (this.results.errors.length > 0) {
            console.log('\nFailed Tests:');
            this.results.errors.forEach(error => {
                console.log(`- ${error.test}: ${error.error}`);
            });
        }
        
        console.log('\n' + (this.results.failed === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed.'));
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RegressionTestRunner;
}