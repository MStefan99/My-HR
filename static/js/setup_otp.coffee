formElement = document.querySelector('#register-form')
qrElement = document.querySelector('#qr')
secretElement = document.querySelector('#secret')
otpElement = document.querySelector('#otp')


addEventListener('load', ->
	res = await fetch('/console/get-otp/')
	secret = await res.json()

	qrElement.setAttribute('src', secret.qr)

	secretElement.innerHTML = 'If you cannot scan QR code with your device, please paste
		this code into your authenticator app: ' + secret.secret

	secretLabel = document.createElement('input')
	secretLabel.type = 'hidden'
	secretLabel.name = 'secret'
	secretLabel.value = secret.secret
	formElement.appendChild(secretLabel)
)


'keyup keydown change paste'.split(' ').forEach((event) ->
	otpElement.addEventListener(event, ->
		otpElement.value = otpElement.value.replace(/\D/, '');
	)
)
