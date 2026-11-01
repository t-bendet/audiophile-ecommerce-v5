/** The id as the owner reads it aloud: its last eight characters. */
export const shortOrderId = (id: string) => `#${id.slice(-8).toUpperCase()}`;
