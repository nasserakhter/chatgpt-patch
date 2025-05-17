const originalFetch = window.fetch;

const HISTORY_LENGTH = 20;

async function patchFetch(...args) {
  const response = await originalFetch(...args);
  const clonedResponse = response.clone();

  let returnedResponse = response;

  const parts = response.url.split('/');
  if (
    parts.length === 6 &&
    parts[5].length === 36 &&
    response.url.toLocaleLowerCase().startsWith('https://chatgpt.com/backend-api/conversation/')
  ) {
    const data = await clonedResponse.json();
    if (typeof data === 'object' && data !== null && 'current_node' in data) {
      let previousNode = null;
      let currentNode = data.current_node;
      const mapping = data.mapping;

      const history = {};

      for (let i = 0; i < HISTORY_LENGTH; i++) {
        const node = mapping[currentNode];
        if (node) {
          history[currentNode] = {
            ...node,
            children: previousNode ? [previousNode] : []
          };
          if (!node.parent) {
            break;
          }
          previousNode = currentNode;
          currentNode = node.parent;
        } else {
          break;
        }
      }

      history[currentNode] = {
        children: [previousNode],
        id: currentNode,
        parent: null,
        message: null,
      }

      const newData = {
        ...data,
        mapping: history
      }

      console.log(newData);

      const newResponse = new Response(JSON.stringify(newData), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

      returnedResponse = newResponse;
    }
  }


  return returnedResponse;
}

window.fetch = patchFetch;