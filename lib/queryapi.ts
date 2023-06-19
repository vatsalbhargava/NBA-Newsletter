import openai from './chatgpt'
import admin from 'firebase-admin';
import { adminDb } from '../firebaseadmin';

interface Session {
  user: {
    email: string;
  };
}

const query = async (prompt: string, chatId: string, model: string, session: Session) => {
    // Retrieve previous messages from Firestore
    const previousMessagesSnapshot = await adminDb
        .collection('users')
        .doc(session?.user?.email)
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('createdAt')
        .get();
    let messages = ["The following text contains a conversation between you and the user of this system. Respond to the latest message in the coversation with the necessary prior context (if available). Do not include the text 'chatbot', 'user said', or 'you responded'at the start of your answer. If the user types in just a date, just respond with 'Thank you, please provide the bets you would like to analyze'."];
    // Add previous messages to the array
    previousMessagesSnapshot.forEach((doc) => {
        const messageData = doc.data();
        // true = user, false = AI
        var user_or_chat = false;
        if (!user_or_chat) {
            messages.push(`you responded : ${messageData.text}`);
            user_or_chat = true;
        } else {
            messages.push(`user said : ${messageData.text}`);
            user_or_chat = false;
        }
    });
    // Combine all messages into a single string
    
    const conversation = messages.join('\n');
    console.log(conversation)
    const res = await openai.createCompletion({
        model,
        prompt: conversation,
        temperature: 0.5,
        top_p: 1,
        max_tokens: 10000,
        frequency_penalty: 0,
        presence_penalty: 0,
    }).then(res => res.data.choices[0].text)
    .catch(
        (err) => 
            `NBANewsletter was unable to find an answer for that! (Error: ${err.message})`
    )
    return res
}

export default query