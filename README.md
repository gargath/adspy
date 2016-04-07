VASTly
==============================

A Chrome Developer Tools Plugin for debugging video ad request / response pairs

# Functionality
VASTly will listen for ad-related requests and parse the response received.
Keeping track of the trackers, wrapper URLs and media file URLs, it will then identify which of these are actually called by the ad integration.
This allows the user to verify at a glance what behaviour to expect from player and ad server reporting.

## Usage
Install in Chrome as an unpacked extension
Open developer tools on a page containing an ad-enabled video player and select the VASTly tab

# Supported Formats
VASTly will correctly analyze and track VAST 2.0 and VPTP-type responses.
