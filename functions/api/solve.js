// /functions/api/solve.js - Your Secure Cloudflare Backend

export async function onRequestPost(context) {
    try {
        // Extract the request and your environment variables from Cloudflare
        const { request, env } = context;
        
        // 1. Get the data sent from your frontend
        const body = await request.json();
        const rawInput = body.rawInput;
        const currentImageBase64 = body.currentImageBase64;
        
        // 2. Get the API key securely from Cloudflare's locked settings
        const apiKey = env.GEMINI_API_KEY; 

        if (!apiKey) {
            throw new Error("API Key is missing in Cloudflare Environment Variables!");
        }

        // 3. Set up the payload exactly like we did before
        let partsArray = [];
        if (currentImageBase64) {
            const base64String = currentImageBase64.split(',')[1];
            const mimeType = currentImageBase64.split(';')[0].split(':')[1];
            partsArray.push({ inlineData: { data: base64String, mimeType: mimeType } });
            partsArray.push({ text: rawInput ? `Problem: ${rawInput}` : "Solve all math problems in this image briefly and concisely. Do not explain your thought process." });
        } else {
            partsArray.push({ text: `Problem: ${rawInput}` });
        }

        const requestBody = {
            contents: [{ parts: partsArray }],
            systemInstruction: {
                parts: [{ text: "You are a direct, professional math solver. Output ONLY the mathematical solution. Be extremely concise. Keep steps short. DO NOT output conversational filler or your internal thought process. Use standard Markdown. If there are multiple problems, solve ALL of them briefly. Structure each problem as:\n### Given\n### Steps\n### Answer" }]
            }
        };

        // 4. Send the request to Google securely from Cloudflare's server!
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (!response.ok) {
           throw new Error(data.error?.message || "Google API Connection Failed");
        }

        // 5. Send the AI's answer safely back to your website
        const fullAiOutput = data.candidates[0].content.parts[0].text;
        
        // Cloudflare returns JSON natively like this:
        return Response.json({ success: true, result: fullAiOutput });

    } catch (error) {
        console.error("Backend Error:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}
