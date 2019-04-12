README
Split It - Bill Splitting Application using Optical Character Recognition and P2P Transactions
Finn McLaughlin C15536837

## DISCLAIMER ##
Due to the restrictions of being unable to push specific API credentials to Github, to be able to run the final application I will need to be contacted.

## Introduction
Split It allows users to split a bill amongst several cards by taking a picture
of the bill, which converts the items on the bill into a list which is shared
amongst the user's devices, checking off what they themselves are paying for,
and sending the required amount of money to the host to allow for one easy 
payment.


## Requirements
A list of dependencies is found in the package.json file. To link these dependencies use npm -link or yarn -link

Upon installing yarn or npm make sure tho remove the concatanted part of the string returned by getAdbPath() in runAndroid.js as well as removing the concatanated string added to adbPath in _logAndroid() in logAndroid.js

As this is more of a proof of concept application, to successfully finish the payment part of the process, the backend server must be run alongside ngrok, to allow the localhost URL to be tunneled through a new URL, which needs to be manually put in the payment screen before loading the application on each device.


## Usage
Once successfully logged in, a user can choose to host a bill, which will take them to a camera screen, or join a bill, which will then prompt them to enter a Bill ID to join.

Host User - The host user takes a picture of a bill, reviews it, and accepts the picture for formatting. This items and prices in the image are extracted and a list is generated using this extraceed data. The user will then be prompted to enter in the total price of the bill, which will be compared to the calculated bill total (using the extracted prices). If they are not equal, the bill ID is not displayed, preventing the host from sharing the bill. The host must then review the items and prices with the bill to update any inaccuracies. Once the total price and calculated price are equal, the bill ID is displayed, and the host can share the list with other users. The user chooses the items they are paying for / splitting by pressing the choose buttons on each row. When all items have been accounted for, the remaining price will disapear from the footer and "Finished" will be displayed. Clicking that will allow the user to review their individual total. Once each user has finished choosing, the host user is brought to a waiting screen, until each joining user transfers the funds to the host user's account.

Joining User - The joining user inputs the bill ID given to them by the host user, in order to gain access to the bill list. The user chooses the items they are paying for / splitting by pressing the choose buttons on each row. When all items have been accounted for, the remaining price will disapear from the footer and "Finished" will be displayed. Clicking that will allow the user to review their individual total. Once each user has finished choosing, the joining user is brought to a PayPal login screen. The user logs into their account, accept the payment, and the funds are transfered to the host.


