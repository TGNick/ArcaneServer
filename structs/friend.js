    const Friends = require("../model/friends.js");
const functions = require("../structs/functions.js");

async function validateFriendAdd(accountId, friendId) {
    try {
        const sender = await Friends.findOne({ accountId: accountId }).lean();
        const receiver = await Friends.findOne({ accountId: friendId }).lean();
        if (!sender || !receiver) return false;

        if (sender.list.accepted.find(i => i.accountId === receiver.accountId) || receiver.list.accepted.find(i => i.accountId === sender.accountId)) return false;
        if (sender.list.blocked.find(i => i.accountId === receiver.accountId) || receiver.list.blocked.find(i => i.accountId === sender.accountId)) return false;
        if (sender.accountId === receiver.accountId) return false;

        return true;
    } catch (error) {
        console.error("Error in validateFriendAdd:", error);
        return false;
    }
}

async function validateFriendDelete(accountId, friendId) {
    try {
        const sender = await Friends.findOne({ accountId: accountId }).lean();
        const receiver = await Friends.findOne({ accountId: friendId }).lean();
        if (!sender || !receiver) return false;

        return true;
    } catch (error) {
        console.error("Error in validateFriendDelete:", error);
        return false;
    }
}

async function validateFriendBlock(accountId, friendId) {
    try {
        const sender = await Friends.findOne({ accountId: accountId }).lean();
        const receiver = await Friends.findOne({ accountId: friendId }).lean();
        if (!sender || !receiver) return false;

        if (sender.list.blocked.find(i => i.accountId === receiver.accountId)) return false;
        if (sender.accountId === receiver.accountId) return false;

        return true;
    } catch (error) {
        console.error("Error in validateFriendBlock:", error);
        return false;
    }
}

async function sendFriendReq(fromId, toId) {
    try {
        if (!await validateFriendAdd(fromId, toId)) return false;

        const from = await Friends.findOne({ accountId: fromId });
        const to = await Friends.findOne({ accountId: toId });

        from.list.outgoing.push({ accountId: to.accountId, created: new Date().toISOString() });
        to.list.incoming.push({ accountId: from.accountId, created: new Date().toISOString() });

        // Sending XMPP messages
        functions.sendXmppMessageToId({/* Message payload */}, from.accountId);
        functions.sendXmppMessageToId({/* Message payload */}, to.accountId);

        await Promise.all([
            from.updateOne({ $set: { list: from.list } }),
            to.updateOne({ $set: { list: to.list } })
        ]);

        return true;
    } catch (error) {
        console.error("Error in sendFriendReq:", error);
        return false;
    }
}

// Other functions: acceptFriendReq, deleteFriend, blockFriend

module.exports = {
    validateFriendAdd,
    validateFriendDelete,
    validateFriendBlock,
    sendFriendReq,
    // Other functions
};
