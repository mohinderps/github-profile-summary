import React, { Component } from 'react';
import { Pie } from 'react-chartjs-2';
import './Home.css';
import ReactGA from 'react-ga';
import HomeSearchBar from './components/Home-Search-Bar';
import HomeUserMeta from './components/Home-User-Meta';
import HomeStats from './components/Home-Stats';
import HomeLanguages from './components/Home-Languages';
import HomeCommits from './components/Home-Commits';
import HomeEvents from './components/Home-Events';
import HomeRepos from './components/Home-Repos';
import { getUserData } from './services/api';

const colors = [
  '#555662',
  '#3c93a3',
  '#5fbacc',
  '#3b3c4b',
  '#9a9a9a',
  '#323238',
  '#063740',
  '#d2d2d2'
];

class AppHome extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userSearchQuery: '',
      userData: null,
      loadingUser: false,
      userError: null,
      showRepoPopup: false,
      repoPopup: null
    };

    this.getUserData = this.getUserData.bind(this);
    this.getUserError = this.getUserError.bind(this);
    this.createRepoPopup = this.createRepoPopup.bind(this);
    this.popupClicked = this.popupClicked.bind(this);
    this.getRepoPopupData = this.getRepoPopupData.bind(this);
    this.getRepoPopupOptions = this.getRepoPopupOptions.bind(this);
    this.getRepoPopupName = this.getRepoPopupName.bind(this);
  }

  componentDidMount() {
    if (this.props.username) {
      this.setState({
        userSearchQuery: this.props.username
      });
      this.getUserData(this.props.username);
    }
  }

  getUserData = async (username) => {
    ReactGA.event({
      category: 'Search',
      action: 'Searched user'
    });
    this.setState({
      loadingUser: true,
      userError: null
    });
    try {
      const result = await getUserData(username);
      if (!result.ok) {
        const error = await result.json();
        if (error.message && error.message.includes('with the login')) {
          throw new Error(
            `User '${username}' not found. Please check the username and try again.`
          );
        }
        throw new Error('Error loading user, please try again.');
      }
      const userData = await result.json();
      this.setState({
        userData,
        loadingUser: false
      });
    } catch (e) {
      this.setState({
        loadingUser: false,
        userError: e.message
      });
    }
  };

  getUserError = () => {
    if (this.state.userError) {
      return <div className="Home-error">{this.state.userError}</div>;
    }
    return '';
  };

  createRepoPopup = (repoPopup) => {
    if (this.state.userData && this.state.userData.repoLanguagePercents) {
      // eslint-disable-next-line react/no-access-state-in-setstate
      const langsForRepo = this.state.userData.repoLanguagePercents.find(
        ({ repo }) => repoPopup.name === repo
      );
      this.setState({
        showRepoPopup: true,
        repoPopup: langsForRepo
      });
    }
  };

  popupClicked = (event) => {
    if (event.target && event.target.id === 'Home-repopopup') {
      this.setState({
        showRepoPopup: false,
        repoPopup: null
      });
    }
  };

  getRepoPopupData = () => {
    let languages = [];
    if (this.state.repoPopup && this.state.repoPopup.languages) {
      ({ languages } = this.state.repoPopup);
    }
    const data = {
      labels: languages.map(lang => `${lang.name} ${lang.percent}%`),
      datasets: [
        {
          backgroundColor: languages.map(
            (lang, index) => colors[index % colors.length]
          ),
          data: languages.map(lang => lang.percent)
        }
      ]
    };
    return data;
  };

  getRepoPopupOptions = () => {
    const options = {
      maintainAspectRatio: true,
      animation: {
        animateScale: true
      },
      elements: {
        arc: {
          borderColor: 'rgba(52, 54, 66, 0.9)'
        }
      },
      tooltips: {
        callbacks: {
          label: (tooltipItem, data) => `${data.labels[tooltipItem.index]}`
        }
      }
    };
    return options;
  };

  getRepoPopupName = () => {
    if (this.state.repoPopup) {
      return this.state.repoPopup.repo || 'Unknown';
    }
    return 'Unknown';
  };

  render() {
    return (
      <div className="Home">
        <div className="Home-container">
          {this.getUserError()}
          <HomeSearchBar
            query={ this.state.userSearchQuery }
            onSubmit={ this.getUserData }
            loadingUser={ this.state.loadingUser }
          />
          <div className="Home-Row-1 row">
            <HomeUserMeta userData={ this.state.userData } />
            <HomeStats userData={ this.state.userData } />
            <HomeLanguages userData={ this.state.userData } />
            <HomeCommits userData={ this.state.userData } />
            <HomeEvents userData={ this.state.userData } />
            <HomeRepos
              userData={ this.state.userData }
              onRepoClick={ this.createRepoPopup }
            />
          </div>
        </div>
        <div
          id="Home-repopopup"
          className="Home-repopopup"
          style={ { display: this.state.showRepoPopup ? 'flex' : 'none' } }
          onClick={ this.popupClicked }
        >
          <div>
            <p className="Home-repopopup-name">{this.getRepoPopupName()}</p>
            <Pie
              width={ 285 }
              height={ 285 }
              data={ this.getRepoPopupData() }
              options={ this.getRepoPopupOptions() }
            />
          </div>
        </div>
      </div>
    );
  }
}

export default AppHome;
