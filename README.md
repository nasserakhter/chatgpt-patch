
# ChatGPT Patch

**A userscript patch to fix the ChatGPT SPA WebApp's React rendering issues.**

## 🚑 What It Fixes

ChatGPT’s React WebApp does some **very terrible** optimizations:

- Loads **the entire conversation history** into the DOM, no matter how long.
- Loads **every variation** (regenerations, edits, etc.).
- **Re-renders the whole damn tree** every time new tokens stream in, which leaves the website frozen until either the responses stream in, or you refresh the page.

Result?  
**Window freezes**, **CPU spikes**, and **battery drain** — especially brutal on low-end devices.

## 🔧 What This Patch Does

The `patch.js` file:

- Limits rendering to the **latest branch** (active variation of the convo).
- Displays only the **most recent 20 messages** (can easily be changed).
- **Keeps memory untouched** — ChatGPT's context stays the same, just the UI is fixed.

This means:

- **Smoother experience**  
- **Less jank and stutter**  
- **Battery-friendly** performance  

## 📦 Installation & How To Use

Use any userscript injector that **supports injecting before page load**.
An example of this is "CodeInjector", note **I did not make this extension, I have only used it and cannot guarantee its safety**

[CodeInjector on Chrome Web Store](https://chromewebstore.google.com/detail/code-injector/edkcmfocepnifkbnbkmlcmegedeikdeb)

1. Download this repository as a zip file or clone using git.
2. Go to the `chatgpt.com` website, and open the CodeInjector extension.
3. Create a new rule, and at the very top select `current host`.
4. Then switch over to the `files` tab and enter the **full path** to the `patch.js` file on your computer. It might look something like this: `C:\Users\Nasser\Downloads\chatgpt-patch\patch.js`
6. 
7. Lastly, and **most important**, UNCHECK the checkbox on the bottom that says `On PageLoad`.
8. Refresh ChatGPT and it should now load the latest 20 messages only.

## Changing The Message History Length
Simple open the `patch.js` file on your computer in any text editor.
Change the line:
```js
const HISTORY_LENGTH = 20;
```
from `20` to whatever number you want.

## ⚠️ Disclaimer

This is a UI patch.  
It doesn’t touch ChatGPT’s backend, memory, or actual message storage.  
You still get the full experience — just without the React-induced seizures.

## Technical Explanation of Code

The code essentially hijacks the `fetch` function because thats what the ChatGPT WebApp uses to pull in all the messages.

Any request that comes in is first matched based on this criteria:

- **StartsWith**: https://chatgpt.com/backend-api/conversation/
- Has only **ONE** path segment after the URL (for the conversation ID)

If the URL matches, then it parses the JSON which includes every mesage in the conversation including regenerations and edits. It finds the latest node using the provided `current_node` property.
It then traverses up the node tree until it reaches either `HISTORY_LENGTH` or a `null` message.

Each traversal adds the message in to am in memory object that stores the "new" chat history.

It then replaces each node's `children` property to remove any references to alternative regenerations or edits, 

Lastly, it creates a blank message object that looks as follows to the be the **parent** object.
```json
{
	"id": "<last id>"
	"children": [<child id>],
	"parent": null,
	"message": null
}
```

Newer chats use a `client-created-root` as the ID for the parent node, however, the WebApp doesn't seem to have any specific logic requiring its use. It essentially treats any node with a `null` parent and `null` message as a "parent" regardless of its ID. This is actually beneficial for us as it gives us one less thing to worry about.

Once the "new" history object is prepared, the original fetch promise is resolved with the new JSON data.

The old history object that contains all messages should at this point be collected by the garbage collector and the memory should be freed.
