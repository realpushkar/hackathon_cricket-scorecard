# Cricket Scorecard App Test Scenario
## Match: Mumbai Indians vs Chennai Super Kings (T20)

### Pre-Match Setup
1. **Teams**: Mumbai Indians vs Chennai Super Kings
2. **Format**: T20 (20 overs)
3. **Toss**: Mumbai Indians won, elected to bat first
4. **Players**: 
   - MI: Rohit Sharma, Ishan Kishan, Suryakumar Yadav, Tilak Varma, Hardik Pandya, Tim David, Cameron Green, Hrithik Shokeen, Piyush Chawla, Jason Behrendorff, Jofra Archer
   - CSK: Ruturaj Gaikwad, Devon Conway, Moeen Ali, Shivam Dube, Ambati Rayudu, MS Dhoni, Ravindra Jadeja, Mitchell Santner, Deepak Chahar, Tushar Deshpande, Matheesha Pathirana

### First Innings - Mumbai Indians Batting

#### Over 1 (Deepak Chahar bowling)
- Ball 1: Rohit Sharma - 0 runs (dot ball)
- Ball 2: Rohit Sharma - 4 runs (boundary)
- Ball 3: Rohit Sharma - 1 run (single)
- Ball 4: Ishan Kishan - 0 runs (dot)
- Ball 5: Ishan Kishan - 6 runs (six!)
- Ball 6: Ishan Kishan - 2 runs
**End of Over 1: MI 13/0**

#### Over 2 (Tushar Deshpande bowling) 
- Ball 1: Ishan Kishan - Wide
- Ball 1: Ishan Kishan - 4 runs
- Ball 2: Ishan Kishan - Wicket! (Caught by Ruturaj)
- Ball 3: Suryakumar Yadav - 0 runs
- Ball 4: Suryakumar Yadav - 1 run
- Ball 5: Rohit Sharma - No ball
- Ball 5: Rohit Sharma - 4 runs (free hit)
- Ball 6: Rohit Sharma - 2 runs
**End of Over 2: MI 26/1**

### Key Test Points:

1. **Match Setup**
   - Can enter custom player names
   - Toss details work correctly
   - Match format selection

2. **Scoring Features**
   - Regular runs (0-6)
   - Extras: Wide, No-ball, Bye, Leg-bye
   - Valid ball counting (wides/no-balls don't count)
   - Strike rotation after odd runs

3. **Bowler Management**
   - Select new bowler after each over
   - Bowling figures update correctly
   - Economy rate calculation

4. **Wicket Handling**
   - Different dismissal types
   - Next batsman comes in
   - Fall of wickets tracking

5. **Innings Transition**
   - First innings total becomes target
   - Teams swap roles
   - Required run rate displayed

6. **Match Completion**
   - Winner determination
   - Match awards calculation
   - Save match functionality

### Expected Issues to Check:
1. Do wides and no-balls correctly not count as valid deliveries?
2. Does the strike rotate properly on odd runs?
3. Are extras displayed correctly (team total vs bowler figures)?
4. Does the over counter reset after 6 valid balls?
5. Can you change bowlers easily?
6. Are the awards calculated correctly?

### Test Results:
- [ ] Match setup works smoothly
- [ ] Scoring is accurate
- [ ] Extras handled correctly
- [ ] Bowler changes work
- [ ] Wickets recorded properly
- [ ] Innings transition smooth
- [ ] Target calculation correct
- [ ] Winner displayed prominently
- [ ] Awards make sense
- [ ] Match saved successfully