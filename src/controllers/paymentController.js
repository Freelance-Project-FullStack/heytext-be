const crypto = require('crypto');
const moment = require('moment');

const createPayment = async (req, res) => {
  try {
    const { amount, orderType, orderInfo, courseId } = req.body;

    // VNPay Config
    const vnp_TmnCode = "YOUR_TMN_CODE";
    const vnp_HashSecret = "YOUR_HASH_SECRET";
    const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const vnp_ReturnUrl = "http://yourdomain.com/payment/vnpay_return";

    // Payment data
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const orderId = moment(date).format('HHmmss');
    
    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_IpAddr: req.ip,
      vnp_CreateDate: createDate
    };

    // Sort params
    const sortedParams = sortObject(vnp_Params);
    
    // Create signature
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex"); 
    vnp_Params['vnp_SecureHash'] = signed;

    // Create payment URL
    const paymentUrl = vnp_Url + "?" + querystring.stringify(vnp_Params, { encode: false });

    // Save order to database
    await Order.create({
      userId: req.user.id,
      courseId,
      amount,
      orderId,
      status: 'pending'
    });

    res.json({ paymentUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const vnpayReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Check signature
    const sortedParams = sortObject(vnp_Params);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");

    if(secureHash === signed) {
      const orderId = vnp_Params['vnp_TxnRef'];
      const rspCode = vnp_Params['vnp_ResponseCode'];

      // Payment successful
      if(rspCode === '00') {
        // Update order status
        await Order.findOneAndUpdate(
          { orderId },
          { status: 'completed' }
        );

        // Grant course access
        const order = await Order.findOne({ orderId });
        await UserCourse.create({
          userId: order.userId,
          courseId: order.courseId
        });

        res.redirect('/payment/success');
      } else {
        // Payment failed
        await Order.findOneAndUpdate(
          { orderId },
          { status: 'failed' }
        );
        res.redirect('/payment/error');
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPayment,
  vnpayReturn
}; 