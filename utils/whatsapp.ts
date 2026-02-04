/**
 * Generates a valid WhatsApp link by sanitizing the phone number and encoding the message.
 * @param phone The input phone number (can contain masks, spaces, +55, etc.)
 * @param message The text message to send
 * @returns A fully formed WhatsApp URL
 */
export const getWhatsAppLink = (phone: string, message: string): string => {
    if (!phone) return '#';

    // 1. Remove all non-numeric characters
    let cleanNumber = phone.replace(/\D/g, '');

    // 2. Check if it's a valid Brazilian number (approximate logic)
    // If it has 10 or 11 digits, we assume it's missing the country code (55)
    // Common case: 31999999999 -> 11 digits
    if (cleanNumber.length === 10 || cleanNumber.length === 11) {
        cleanNumber = `55${cleanNumber}`;
    }

    // If it already has 12 or 13 digits (e.g. 5531999999999), we assume it's correct.
    // If it's too short, it might be invalid, but we return it as is to avoid blocking completely.

    // 3. Encode the message
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
};
