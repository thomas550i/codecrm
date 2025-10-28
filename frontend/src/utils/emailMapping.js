export function mapCommunicationsToActivities(docinfo, message) {
  if (docinfo && Array.isArray(docinfo.communications)) {
    return docinfo.communications.map(comm => ({
      data: {
        subject: comm.subject || comm.data?.subject,
        content: comm.content || comm.data?.content,
        sender_full_name: comm.sender_full_name || comm.data?.sender_full_name,
        sender: comm.sender || comm.data?.sender,
        recipients: comm.recipients || comm.data?.recipients,
        cc: comm.cc || comm.data?.cc,
        bcc: comm.bcc || comm.data?.bcc,
        attachments: comm.attachments ? (typeof comm.attachments === 'string' ? JSON.parse(comm.attachments) : comm.attachments) : [],
        delivery_status: comm.delivery_status || comm.data?.delivery_status,
        communication_date: comm.communication_date || comm.data?.communication_date,
      }
    }));
  }
  if (Array.isArray(message)) {
    return message.flat().filter(m => m.activity_type === 'communication').map(m => ({
      data: {
        ...m.data,
        communication_date: m.communication_date,
      }
    }));
  }
  return [];
}