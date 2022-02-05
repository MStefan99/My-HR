// Generated by CoffeeScript 2.5.1
(function() {
  'use strict';
  var addApplication, applicationsTable, remove;

  applicationsTable = document.querySelector('#applications-table');

  remove = function(element) {
    return element.parentNode.removeChild(element);
  };

  addApplication = function(application) {
    var cvCell, cvLink, emailCell, phoneCell, removeCell, removeLink, tableRow;
    tableRow = document.createElement('tr');
    applicationsTable.appendChild(tableRow);
    emailCell = document.createElement('td');
    tableRow.appendChild(emailCell);
    emailCell.innerHTML = application.backupEmail;
    phoneCell = document.createElement('td');
    tableRow.appendChild(phoneCell);
    phoneCell.innerHTML = application.phone;
    cvCell = document.createElement('td');
    tableRow.appendChild(cvCell);
    cvLink = document.createElement('a');
    cvCell.appendChild(cvLink);
    cvLink.href = '/download/' + application.filePath;
    cvLink.innerHTML = application.fileName;
    removeCell = document.createElement('td');
    tableRow.appendChild(removeCell);
    removeLink = document.createElement('span');
    removeCell.appendChild(removeLink);
    if (application.accepted !== 1) {
      removeLink.innerHTML = 'Remove';
      removeLink.classList.add('clickable');
      return removeLink.addEventListener('click', async function() {
        var res;
        if (confirm('Are you sure you want to delete your application? If you choose to continue, we will delete all data associated with this application and will no longer be able to offer you a Mine Eclipse position. Do you still wish to continue?')) {
          res = (await fetch('/applications/' + application.id, {
            method: 'delete'
          }).catch(function() {
            return alert('Could not delete the application. Please check your internet connection.');
          }));
          if (res.ok) {
            return remove(tableRow);
          } else {
            switch ((await res.text())) {
              case 'ALREADY_ACCEPTED':
                return alert('Your application was already accepted and cannot be removed.');
              case 'NOT_ALLOWED':
                return alert('This application was submitted by another user and you cannot remove it.');
            }
          }
        }
      });
    } else {
      return removeLink.innerHTML = 'Accepted';
    }
  };

  addEventListener('load', async function() {
    var application, applications, i, len, res, results;
    res = (await fetch('/applications/').catch(function() {
      return alert('Could not download application list. Please check your internet connection.');
    }));
    applications = (await res.json());
    results = [];
    for (i = 0, len = applications.length; i < len; i++) {
      application = applications[i];
      results.push(addApplication(application));
    }
    return results;
  });

}).call(this);

//# sourceMappingURL=manage.js.map
