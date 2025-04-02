import requests

url = "https://api.play.ht/api/v2/cloned-voices"

headers = {
    "accept": "application/json",
    "AUTHORIZATION": "146ba1f06ff446579e9f6c164942cc35",
    "X-USER-ID": "eLPTn5Nu7fXYqntMvKssgAdLqtv2"
}

response = requests.get(url, headers=headers)

print(response.text)