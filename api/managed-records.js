import URI from 'urijs';

// Use window.path as the base URL for the /records endpoint to align with the test setup
function getBaseUrl() {
  return window.path || 'http://localhost:3000/records';
}

function retrieve(options = {}) {
  const { page = 1, colors = [] } = options;
  const limit = 10;
  const offset = (page - 1) * limit;

  let url = new URI(getBaseUrl())
    .addQuery('limit', limit + 1) // Request one extra record to check for the last page
    .addQuery('offset', offset);

  colors.forEach(color => url.addQuery('color[]', color));

  return fetch(url.toString())
    .then(response => {
      if (!response.ok) {
        // Throw an error for any non-OK response, ensuring our catch block is triggered for HTTP errors as well.
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => transformData(data, page, limit))
    .catch(error => {
      // Ensure this catch block is called for both network errors and thrown errors for non-OK HTTP statuses.
      console.log(error.message);
      return errorRecovery();
    });
}

function transformData(data, page, limit) {
  // Adjust logic if we're on the last page based on whether we received limit + 1 items
  const isLastPage = data.length <= limit;
  const nextPage = isLastPage ? null : page + 1;
  const adjustedData = data.slice(0, limit); // Adjust data to only include up to the limit

  const ids = adjustedData.map(item => item.id);
  const open = adjustedData.filter(item => item.disposition === 'open').map(item => ({
    ...item,
    isPrimary: ['red', 'blue', 'yellow'].includes(item.color)
  }));
  const closedPrimaryCount = adjustedData.filter(item => item.disposition === 'closed' && ['red', 'blue', 'yellow'].includes(item.color)).length;

  return {
    ids,
    open,
    closedPrimaryCount,
    previousPage: page > 1 ? page - 1 : null,
    nextPage
  };
}

function errorRecovery() {
  return {
    ids: [],
    open: [],
    closedPrimaryCount: 0,
    previousPage: null,
    nextPage: null
  };
}

export default retrieve;
