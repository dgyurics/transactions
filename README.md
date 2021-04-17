### Node.js streaming performance

This is a script which processes transactions[1-3].csv in the assets directory.   
  
*Though we are only dealing with 300k transactions, the script is designed to handle hundreds of millions in a real world scenario.*

These files each contain 100k bank and credit card transactions for ~100 users (not real users). The files are sorted by user id, but not by anything else. Each row has 7 columns and is properly formatted (although you will need to infer the exact csv formatting params yourself).
1. User id
2. Account id (this column can be ignored)
3. Amount (this field should always be positive)
4. Random string with tricky characters to parse (where a transaction description would normally go)
5. Date
6. Type (debit/credit - debit means negative amount. credit means positive amount)
7. Another random string with tricky characters to parse


The desired output is a csv with the columns:
1. user_id
2. Number of of transactions for user
3. The sum of transaction amounts for the user (use exactly 2 decimal places). This is the same as the final balance.
4. The min balance (running sum) for the user at the end of any day (use exactly 2 decimal places). This value should be at most $0 since it starts there.
5. The max balance (running sum) for the user at the end of any day (use exactly 2 decimal places). This value should be at least $0 since it starts there.


Example:
10/15 credit $5  
10/16 credit $3  
10/17 nothing happens  
10/18 debit $6  
10/19 credit $10  
10/19 debit $2  
10/20 debit $1  
For this user, the output should be:  
        number of transactions: 6  
        sum of transactions: 9  
minimum balance: 0  
maximum balance: 10 (Yes, it’s 10, not 12 because there are 2 transactions on 10/19)  
