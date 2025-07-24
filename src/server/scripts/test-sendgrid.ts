import sgMail from '@sendgrid/mail';

async function testSendGrid() {
  console.log('🧪 Testing SendGrid configuration...');
  
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'ProposalAI <noreply@proposalai.com>';
  
  console.log('📧 Configuration:');
  console.log(`   API Key: ${apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : 'NOT SET'}`);
  console.log(`   From Email: ${fromEmail}`);
  
  if (!apiKey) {
    console.log('❌ SENDGRID_API_KEY not set in environment variables');
    return;
  }
  
  try {
    sgMail.setApiKey(apiKey);
    console.log('✅ SendGrid API key set successfully');
    
    // Test with a simple email
    const msg = {
      to: 'test@example.com', // This will fail but we'll see the error
      from: fromEmail,
      subject: 'Test Email from ProposalAI',
      text: 'This is a test email to verify SendGrid configuration.',
      html: '<p>This is a test email to verify SendGrid configuration.</p>'
    };
    
    console.log('📧 Attempting to send test email...');
    const response = await sgMail.send(msg);
    console.log('✅ Test email sent successfully!');
    console.log('Response:', response);
    
  } catch (error) {
    console.error('❌ SendGrid test failed:');
    console.error('Error:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as any).response;
      console.error('Response Details:');
      console.error('  Status:', response?.status);
      console.error('  Status Text:', response?.statusText);
      console.error('  Data:', JSON.stringify(response?.data, null, 2));
    }
    
    // Common issues and solutions
    console.log('\n🔧 Common Solutions:');
    console.log('1. Verify your SendGrid API key is correct');
    console.log('2. Make sure the "from" email is verified in your SendGrid account');
    console.log('3. Check if your SendGrid account is active and not suspended');
    console.log('4. Verify your SendGrid account has sending permissions');
  }
}

testSendGrid()
  .then(() => {
    console.log('🧪 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 