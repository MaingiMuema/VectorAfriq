import nodemailer from 'nodemailer';

async function testEmailConfig() {
  console.log('Testing email configuration...');
  
  const config = {
    host: 'mail.vectorafriqproperties.co.ke',
    port: 465,
    secure: true, // Use SSL for port 465
    auth: {
      user: 'noreply@vectorafriqproperties.co.ke',
      pass: 'N0r3ply@Vector',
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    }
  };

  try {
    console.log('Creating transporter...');
    const transporter = nodemailer.createTransport(config);
    
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ Email configuration is valid!');
    
    console.log('Sending test email...');
    const mailOptions = {
      from: 'noreply@vectorafriqproperties.co.ke',
      to: 'noreply@vectorafriqproperties.co.ke', // Send to yourself for testing
      subject: 'Test Email - VectorAfriq Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #468AD1; margin: 0;">VectorAfriq</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Email Configuration Test</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px; border-left: 4px solid #468AD1;">
            <h2 style="color: #333; margin-top: 0;">Test Successful!</h2>
            
            <p style="color: #555; line-height: 1.6;">
              This is a test email to verify that your cPanel email configuration is working correctly.
              The forgot password functionality should now work properly.
            </p>
            
            <p style="color: #555; line-height: 1.6;">
              <strong>Configuration Details:</strong><br>
              Host: mail.vectorafriqproperties.co.ke<br>
              Port: 465<br>
              User: noreply@vectorafriqproperties.co.ke<br>
              Security: SSL/TLS
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px;">
              This is a test email sent at ${new Date().toLocaleString()}.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Email configuration test failed:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
  }
}

// Run the test
testEmailConfig().catch(console.error);
