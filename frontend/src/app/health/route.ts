export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
    const data = await response.json();
    
    return new Response(JSON.stringify({
      status: 'ok',
      backend: data,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'warning',
      message: 'Backend health check failed',
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json'
      },
    });
  }
}
