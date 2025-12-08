// Quick test file to verify API is working
const testAPI = async () => {
    try {
        console.log('Testing /api/research/analyze...');
        const res = await fetch('http://localhost:3000/api/research/analyze?symbol=RELIANCE.NS');
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
};

testAPI();
