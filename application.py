"""
Configures AWS
Generates routes and views for the flask application.
"""
import warnings
warnings.filterwarnings("ignore", category=UserWarning) 
warnings.filterwarnings("ignore", category=FutureWarning) 

import pandas.io.data as web

import os, sys, json, time
import ast

import datetime

import flask
from flask import request, Response, render_template, flash, redirect
from flask_bootstrap import Bootstrap

import numpy as np
import pandas as pd
import scipy as sp

import smtplib

import urllib
from lxml import html
import re



# Default config vals
FLASK_DEBUG = 'false' if os.environ.get('FLASK_DEBUG') is None else os.environ.get('FLASK_DEBUG')

# Create the Flask app
application = flask.Flask(__name__)
application.config['DEBUG'] = True
application.config['TEMPLATES_AUTO_RELOAD'] = True

application.debug = True
Bootstrap(application)

# Load config values specified above
application.config.from_object('config')

# Only enable Flask debugging if an env var is set to true
application.secret_key = 'bdctestbdctest123123123'
application.debug = application.config['FLASK_DEBUG'] in ['true', 'True']

players = pd.read_csv('static/players.csv', index_col=0)
PGA_COL = ['POS', 'CHANGE', 'PLAYER NAME', 'TOTAL', 'THRU', 'TODAY', '1', '2', '3', '4', 'TOTAL_R']


@application.route('/', methods=['POST', 'GET'])
def home():
	url = 'http://espn.go.com/golf/leaderboard'

	html_ = urllib.urlopen(url).read()

	people = html_.split('<tr')[2:]
	good_rows = filter(lambda x: 'player-overview' in x, people)

	positions = map(lambda x: re.search('position sm align-left in post">(.+?)</td>', x).group(1), good_rows)
	change = map(lambda x: re.search('>(.+?)', re.search('movement movement sm in icon-font-before(.+?)</td>', x).group(1)).group(1), good_rows)
	name = map(lambda x: re.search('class="full-name">(.+?)</a>', x).group(1), good_rows)
	total = map(lambda x: re.search('relativeScore sm asc in post">(.+?)</td>', x).group(1), good_rows)
	thru = map(lambda x: re.search('thru  in">(.+?)<', x).group(1), good_rows)
	thru = map(lambda x : re.search('T(.+?)Z', x).group(1) if 'span' in  x else x, thru)
	today = map(lambda x: re.search('currentRoundScore today in">(.+?)</td>', x).group(1), good_rows)
	round1 = map(lambda x: re.search('round1  in post">(.+?)</td>', x).group(1), good_rows)
	round2 = map(lambda x: re.search('round2  in post">(.+?)</td>', x).group(1), good_rows)
	round3 = map(lambda x: re.search('round3  in post">(.+?)</td>', x).group(1), good_rows)
	round4 = map(lambda x: re.search('round4  in post">(.+?)</td>', x).group(1), good_rows)
	total_r = map(lambda x: re.search('round2  in post">(.+?)</td>', x).group(1), good_rows)

	# has_vid = filter(lambda x : 'snappytv_modal' in x, good_rows)
	# namez = map(lambda x: re.search('<a>(.+?)</a>', x).group(1), has_vid)
	# link = map(lambda x : 'http://www.pga.com/pgachampionship/scoring/leaderboard/?video=' + str(re.findall('\d+', x)[0]), map(lambda x: re.search('snappytv_modal(.+?)"', x).group(1), has_vid))

	# name_to_vid = dict(zip(namez, link))
	combined = np.array([positions, change, name, total, thru, today, round1, round2, round3, round4, total_r])
	scoreboard = pd.DataFrame(np.swapaxes(combined, 0 ,1), columns = PGA_COL )
	# scoreboard['Link'] = scoreboard['PLAYER NAME'].map(lambda x: name_to_vid[x] if x in name_to_vid else np.nan)
	scoreboard = scoreboard.set_index('PLAYER NAME')

	scores = players.applymap(lambda x : scoreboard.ix[x, 'TOTAL']) 
	num_scores = scores.replace('-', 0).replace('E', 0).astype(int)
	scores['Total (All 5)'] = num_scores.sum(1)
	scores['Top 3 Total'] = num_scores.apply(lambda x : x.values[x.values.argsort()[:3]].sum() , axis = 1)
	scores['Top 2 Total'] = num_scores.apply(lambda x : x.values[x.values.argsort()[:2]].sum() , axis = 1)
	scores['Top 1 Total'] = num_scores.apply(lambda x : x.values[x.values.argsort()[:1]].sum() , axis = 1)
	thru_board = players.applymap(lambda x : scoreboard.ix[x, 'THRU'])
	scores['Holes Played'] = thru_board.applymap(lambda x : 0 if ':' in x else 18 if 'F' in x else  x).astype(int).sum(1)

	leaderboard = scores.sort_values(['Top 3 Total', 'Top 2 Total', 'Top 1 Total'])

	return render_template('index.html', players = players.to_html(classes='players'), leaderboard  = re.sub(' leaderboard', '" id="leaderboard', leaderboard.to_html(classes = 'leaderboard')), scoreboard = re.sub(' scoreboard', '" id="scoreboard', scoreboard.to_html(classes = 'scoreboard')) )


@application.route('/get_data', methods=['POST'])
def get_data():
	url = 'http://espn.go.com/golf/leaderboard'

	html_ = urllib.urlopen(url).read()

	people = html_.split('<tr')[2:]
	good_rows = filter(lambda x: 'player-overview' in x, people)

	positions = map(lambda x: re.search('position sm align-left in post">(.+?)</td>', x).group(1), good_rows)
	change = map(lambda x: re.search('>(.+?)', re.search('movement movement sm in icon-font-before(.+?)</td>', x).group(1)).group(1), good_rows)
	name = map(lambda x: re.search('class="full-name">(.+?)</a>', x).group(1), good_rows)
	total = map(lambda x: re.search('relativeScore sm asc in post">(.+?)</td>', x).group(1), good_rows)
	thru = map(lambda x: re.search('thru  in">(.+?)<', x).group(1), good_rows)
	thru = map(lambda x : re.search('T(.+?)Z', x).group(1) if 'span' in  x else x, thru)
	today = map(lambda x: re.search('currentRoundScore today in">(.+?)</td>', x).group(1), good_rows)
	round1 = map(lambda x: re.search('round1  in post">(.+?)</td>', x).group(1), good_rows)
	round2 = map(lambda x: re.search('round2  in post">(.+?)</td>', x).group(1), good_rows)
	round3 = map(lambda x: re.search('round3  in post">(.+?)</td>', x).group(1), good_rows)
	round4 = map(lambda x: re.search('round4  in post">(.+?)</td>', x).group(1), good_rows)
	total_r = map(lambda x: re.search('round2  in post">(.+?)</td>', x).group(1), good_rows)

	# has_vid = filter(lambda x : 'snappytv_modal' in x, good_rows)
	# namez = map(lambda x: re.search('<a>(.+?)</a>', x).group(1), has_vid)
	# link = map(lambda x : 'http://www.pga.com/pgachampionship/scoring/leaderboard/?video=' + str(re.findall('\d+', x)[0]), map(lambda x: re.search('snappytv_modal(.+?)"', x).group(1), has_vid))

	# name_to_vid = dict(zip(namez, link))
	combined = np.array([positions, change, name, total, thru, today, round1, round2, round3, round4, total_r])
	scoreboard = pd.DataFrame(np.swapaxes(combined, 0 ,1), columns = PGA_COL )
	# scoreboard['Link'] = scoreboard['PLAYER NAME'].map(lambda x: name_to_vid[x] if x in name_to_vid else np.nan)
	scoreboard = scoreboard.set_index('PLAYER NAME')

	scores = players.applymap(lambda x : scoreboard.ix[x, 'TOTAL']) 
	num_scores = scores.replace('-', 0).replace('E', 0).astype(int)
	scores['Total (All 5)'] = num_scores.sum(1)
	scores['Top 3 Total'] = num_scores.apply(lambda x : x.values[x.values.argsort()[:3]].sum() , axis = 1)
	scores['Top 2 Total'] = num_scores.apply(lambda x : x.values[x.values.argsort()[:2]].sum() , axis = 1)
	scores['Top 1 Total'] = num_scores.apply(lambda x : x.values[x.values.argsort()[:1]].sum() , axis = 1)
	thru_board = players.applymap(lambda x : scoreboard.ix[x, 'THRU'])
	scores['Holes Played'] = thru_board.applymap(lambda x : 0 if ':' in x else 18 if 'F' in x else  x).astype(int).sum(1)

	leaderboard = scores.sort_values(['Top 3 Total', 'Top 2 Total', 'Top 1 Total'])

	out = [ re.sub(' leaderboard', '" id="leaderboard', leaderboard.to_html(classes = 'leaderboard')), re.sub(' scoreboard', '" id="scoreboard', scoreboard.to_html(classes = 'scoreboard')), datetime.datetime.now().strftime("%I:%M%p on %B %d, %Y")]

	return json.dumps(out)



if __name__ == '__main__':

    application.run(host='ec2-52-38-76-210.us-west-2.compute.amazonaws.com')