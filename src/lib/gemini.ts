export async function generateContent(params: any): Promise<any> {
  const response = await fetch('/api/gemini/generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    let errorMsg = await response.text();
    try {
      const data = JSON.parse(errorMsg);
      if (data.error) errorMsg = data.error;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  
  return await response.json();
}
