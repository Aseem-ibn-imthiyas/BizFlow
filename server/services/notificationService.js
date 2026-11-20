const User = require('../models/User');
const Notification = require('../models/Notification');

const createNotifications = async (userIds, notificationData) => {
    try {
        const uniqueIds = [
            ...new Set(userIds.filter(Boolean).map((id) => id.toString())),
        ];

        if (!uniqueIds.length) return;

        const documents = uniqueIds.map((userId) => ({
            user: userId,
            ...notificationData,
        }));

        await Notification.insertMany(documents, { ordered: false });
    } catch (error) {
        console.error('Notification creation error:', error);
    }
};

exports.notifyRoles = async ({
    roles,
    actorId,
    ...notificationData
}) => {
    try {
        const users = await User.find({
            role: { $in: roles },
            status: 'Active',
        }).select('_id');

        const recipients = users;

        await createNotifications(
            recipients.map((user) => user._id),
            notificationData
        );
    } catch (error) {
        console.error('Role notification error:', error);
    }
};

exports.notifyUsers = async ({
    userIds,
    actorId,
    ...notificationData
}) => {
    const recipients = [...new Set(
        (userIds || [])
            .filter(Boolean)
            .map((id) => id.toString())
    )].filter((id) => id !== actorId?.toString());

    await createNotifications(recipients, notificationData);
};