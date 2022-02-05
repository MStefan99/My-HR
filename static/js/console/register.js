// Generated by CoffeeScript 2.5.1
(function() {
  'use strict';
  var codeElement, codeLabel, formElement, passwordElement, passwordLabel, passwordRepeatElement, passwordRepeatLabel, submitButton, usernameElement, validate;

  formElement = document.querySelector('form');

  usernameElement = document.querySelector('#username');

  codeElement = document.querySelector('#code');

  passwordElement = document.querySelector('#password');

  passwordRepeatElement = document.querySelector('#password-repeat');

  codeLabel = document.querySelector('#sc-label');

  passwordLabel = document.querySelector('#pwd-label');

  passwordRepeatLabel = document.querySelector('#pwdr-label');

  submitButton = document.querySelector('#submit-button');

  validate = function() {
    submitButton.disabled = false;
    if (!codeElement.value.length) {
      codeLabel.innerHTML = 'No setup code';
      codeElement.classList.add('status-bad');
      submitButton.disabled = true;
    } else {
      codeLabel.innerHTML = '';
      codeElement.classList.remove('status-bad');
    }
    if (passwordElement.value.length < 8) {
      passwordElement.classList.add('status-bad');
      passwordLabel.innerHTML = 'Password is too short';
      return submitButton.disabled = true;
    } else if (passwordElement.value !== passwordRepeatElement.value) {
      passwordElement.classList.add('status-bad');
      passwordRepeatElement.classList.add('status-bad');
      passwordLabel.innerHTML = 'Passwords do not match!';
      passwordRepeatLabel.innerHTML = 'Passwords do not match!';
      return submitButton.disabled = true;
    } else {
      passwordElement.classList.remove('status-bad');
      passwordRepeatElement.classList.remove('status-bad');
      passwordLabel.innerHTML = '';
      return passwordRepeatLabel.innerHTML = '';
    }
  };

  addEventListener('load', function() {
    var params, username;
    params = new URLSearchParams(window.location.search);
    username = params.get('username');
    if (username) {
      usernameElement.value = params.get('username');
    } else {
      window.location.href = '/console/login';
    }
    return validate();
  });

  formElement.addEventListener('submit', async function(e) {
    var res, value;
    e.preventDefault();
    res = (await fetch('/console/api/v0.1/verify-setup-code/', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        setupCode: codeElement.value
      })
    }).catch(function() {
      return alert('Could not check your code. Please check your internet connection.');
    }));
    if (res.status === 429) {
      value = submitButton.value;
      submitButton.disabled = true;
      submitButton.value = 'Too many attempts';
      return setTimeout(function() {
        submitButton.disabled = false;
        return submitButton.value = value;
      }, 10000);
    } else if (!res.ok) {
      switch ((await res.text())) {
        case 'WRONG_CODE':
          codeLabel.innerHTML = 'Wrong setup code';
          codeElement.classList.add('status-bad');
          return submitButton.disabled = true;
      }
    } else {
      return formElement.submit();
    }
  });

  addEventListener('input', validate);

}).call(this);

//# sourceMappingURL=register.js.map
