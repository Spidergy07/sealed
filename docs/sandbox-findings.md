
### 2026-11-07T13:54:16.857Z token scopes

```json
{
  "has": [
    [
      "shipping/trackers/readwrite",
      true
    ],
    [
      "disputes",
      true
    ]
  ],
  "expires_in_h": "9.0"
}
```

### 2026-11-07T13:54:18.493Z order 1 create

```json
{
  "http": 200,
  "debug_id": "f514338ec60f3",
  "id": "3BT80782H44473250",
  "status": "PAYER_ACTION_REQUIRED",
  "approve": "https://www.sandbox.paypal.com/checkoutnow?token=3BT80782H44473250"
}
```

### 2026-11-07T13:54:20.056Z order 2 create

```json
{
  "http": 200,
  "debug_id": "f261288a40369",
  "id": "75937975HE002722M",
  "status": "PAYER_ACTION_REQUIRED",
  "approve": "https://www.sandbox.paypal.com/checkoutnow?token=75937975HE002722M"
}
```

### 2026-11-07T13:54:20.828Z order 3 create

```json
{
  "http": 200,
  "debug_id": "f669760f9ce9c",
  "id": "66425252S3919764L",
  "status": "PAYER_ACTION_REQUIRED",
  "approve": "https://www.sandbox.paypal.com/checkoutnow?token=66425252S3919764L"
}
```

### 2026-11-07T13:54:22.354Z order 4 create

```json
{
  "http": 200,
  "debug_id": "f704542a3a980",
  "id": "4VW842936V560801J",
  "status": "PAYER_ACTION_REQUIRED",
  "approve": "https://www.sandbox.paypal.com/checkoutnow?token=4VW842936V560801J"
}
```

### 2026-11-07T13:56:08.939Z capture 3BT80782H44473250

```json
{
  "http": 201,
  "debug_id": "f606501a24c7e",
  "capture": "3RT3805171183213T",
  "status": "COMPLETED",
  "seller_protection": {
    "status": "ELIGIBLE",
    "dispute_categories": [
      "ITEM_NOT_RECEIVED",
      "UNAUTHORIZED_TRANSACTION"
    ]
  },
  "ship_to": {
    "name": {
      "full_name": "Jordan Buyer"
    },
    "address": {
      "address_line_1": "2211 N First St",
      "admin_area_2": "San Jose",
      "admin_area_1": "CA",
      "postal_code": "95131",
      "country_code": "US"
    }
  }
}
```

### 2026-11-07T13:56:11.078Z capture 75937975HE002722M

```json
{
  "http": 201,
  "debug_id": "f8976869bb708",
  "capture": "54R76411E0324562K",
  "status": "COMPLETED",
  "seller_protection": {
    "status": "ELIGIBLE",
    "dispute_categories": [
      "ITEM_NOT_RECEIVED",
      "UNAUTHORIZED_TRANSACTION"
    ]
  },
  "ship_to": {
    "name": {
      "full_name": "Jordan Buyer"
    },
    "address": {
      "address_line_1": "2211 N First St",
      "admin_area_2": "San Jose",
      "admin_area_1": "CA",
      "postal_code": "95131",
      "country_code": "US"
    }
  }
}
```

### 2026-11-07T13:56:12.956Z capture 66425252S3919764L

```json
{
  "http": 201,
  "debug_id": "f51118549b84f",
  "capture": "9JN43155RM2635829",
  "status": "COMPLETED",
  "seller_protection": {
    "status": "ELIGIBLE",
    "dispute_categories": [
      "ITEM_NOT_RECEIVED",
      "UNAUTHORIZED_TRANSACTION"
    ]
  },
  "ship_to": {
    "name": {
      "full_name": "Jordan Buyer"
    },
    "address": {
      "address_line_1": "2211 N First St",
      "admin_area_2": "San Jose",
      "admin_area_1": "CA",
      "postal_code": "95131",
      "country_code": "US"
    }
  }
}
```

### 2026-11-07T13:56:15.054Z capture 4VW842936V560801J

```json
{
  "http": 201,
  "debug_id": "f50883242c608",
  "capture": "6CH777787A478920W",
  "status": "COMPLETED",
  "seller_protection": {
    "status": "ELIGIBLE",
    "dispute_categories": [
      "ITEM_NOT_RECEIVED",
      "UNAUTHORIZED_TRANSACTION"
    ]
  },
  "ship_to": {
    "name": {
      "full_name": "Jordan Buyer"
    },
    "address": {
      "address_line_1": "2211 N First St",
      "admin_area_2": "San Jose",
      "admin_area_1": "CA",
      "postal_code": "95131",
      "country_code": "US"
    }
  }
}
```

### 2026-11-07T13:56:16.543Z orders /track (order 1)

```json
{
  "http": 201,
  "debug_id": "f919477f26c79",
  "body": {
    "id": "3BT80782H44473250",
    "intent": "CAPTURE",
    "status": "COMPLETED",
    "payment_source": {
      "paypal": {
        "email_address": "sealed-buyer-us@personal.example.com",
        "account_id": "XM2C726BGR94S",
        "account_status": "VERIFIED",
        "name": {
          "given_name": "Jordan",
          "surname": "Buyer"
        },
        "address": {
          "country_code": "US"
        }
      }
    },
    "purchase_units": [
      {
        "reference_id": "day0-1",
        "amount": {
          "currency_code": "USD",
          "value": "780.00",
          "breakdown": {
            "item_total": {
              "currency_code": "USD",
              "value": "780.00"
            }
          }
        },
        "payee": {
          "email_address": "sb-47ldkp53656934@business.example.com",
          "merchant_id": "4XBPWCW3ZYX98"
        },
        "description": "Used RTX 4080 FE, serial GPU4080FE000",
        "items": [
          {
            "name": "Used RTX 4080 Founders Edition",
            "unit_amount": {
              "currency_code": "USD",
              "value": "780.00"
            },
            "quantity": "1",
            "sku": "GPU4080FE000",
            "category": "PHYSICAL_GOODS"
          }
        ],
        "shipping": {
          "name": {
            "full_name": "Jordan Buyer"
          },
          "address": {
            "address_line_1": "2211 N First St",
            "admin_area_2": "San Jose",
            "admin_area_1": "CA",
            "postal_code": "95131",
            "country_code": "US"
          },
          "trackers": [
            {
              "id": "3RT3805171183213T-9400111899223197428490",
              "status": "SHIPPED",
              "links": [
                {
                  "href": "https://api.sandbox.paypal.com/v2/checkout/orders/3BT80782H44473250",
                  "rel": "up",
                  "method": "GET"
                },
                {
                  "href": "https://api.sandbox.paypal.com/v2/checkout/orders/3BT80782H44473250/trackers/3RT3805171183213T-9400111899223197428490",
                  "rel": "update",
                  "method": "PATCH"
                }
              ],
              "notify_payer": true
            }
          ]
        },
        "payments": {
          "captures": [
            {
              "id": "3RT3805171183213T",
              "status": "COMPLETED",
              "amount": {
                "currency_code": "USD",
                "value": "780.00"
              },
              "final_capture": true,
              "seller_protection": {
                "status": "ELIGIBLE",
                "dispute_categories": [
                  "ITEM_NOT_RECEIVED",
                  "UNAUTHORIZED_TRANSACTION"
                ]
              },
              "seller_receivable_breakdown": {
                "gross_amount": {
                  "currency_code": "USD",
                  "value": "780.00"
                },
                "paypal_fee": {
                  "currency_code": "USD",
                  "value": "27.71"
                },
                "net_amount": {
                  "currency_code": "USD",
                  "value": "752.29"
                }
              },
              "links": [
                {
                  "href": "https://api.sandbox.paypal.com/v2/payments/captures/3RT3805171183213T",
                  "rel": "self",
                  "method": "GET"
                },
                {
                  "href": "https://api.sandbox.paypal.com/v2/payments/captures/3RT3805171183213T/refund",
                  "rel": "refund",
                  "method": "POST"
                },
                {
                  "href": "https://api.sandbox.paypal.com/v2/checkout/orders/3BT80782H44473250",
                  "rel": "up",
                  "method": "GET"
                }
              ],
              "create_time": "2026-11-07T13:56:08Z",
              "update_time": "2026-11-07T13:56:08Z"
            }
          ]
        }
      }
    ],
    "payer": {
      "name": {
        "given_name": "Jordan",
        "surname": "Buyer"
      },
      "email_address": "sealed-buyer-us@personal.example.com",
      "payer_id": "XM2C726BGR94S",
      "address": {
        "country_code": "US"
      }
    },
    "create_time": "2026-11-07T13:56:08Z",
    "update_time": "2026-11-07T13:56:08Z",
    "links": [
      {
        "href": "https://api.sandbox.paypal.com/v2/checkout/orders/3BT80782H44473250",
        "rel": "self",
        "method": "GET"
      }
    ]
  }
}
```

### 2026-11-07T13:56:17.690Z trackers read-back (order 1)

```json
{
  "http": 200,
  "debug_id": "f2764798ff45b",
  "body": {
    "trackers": [
      {
        "transaction_id": "3RT3805171183213T",
        "tracking_number": "9400111899223197428490",
        "tracking_number_type": "CARRIER_PROVIDED",
        "status": "SHIPPED",
        "shipment_date": "2026-11-07",
        "carrier": "USPS",
        "notify_buyer": true,
        "last_updated_time": "1794059776100",
        "shipment_direction": "FORWARD",
        "shipment_uploader": "MERCHANT",
        "account_id": "4XBPWCW3ZYX98",
        "links": [
          {
            "href": "https://api-m.sandbox.paypal.com/v1/shipping/trackers/3RT3805171183213T-9400111899223197428490",
            "rel": "self",
            "method": "GET",
            "encType": "application/json"
          },
          {
            "href": "https://api-m.sandbox.paypal.com/v1/shipping/trackers/3RT3805171183213T-9400111899223197428490",
            "rel": "replace",
            "method": "PUT",
            "encType": "application/json"
          },
          {
            "href": "https://api-m.sandbox.paypal.com/v1/shipping/trackers/3RT3805171183213T-9400111899223197428490",
            "rel": "edit",
            "method": "PATCH",
            "encType": "application/json"
          }
        ]
      }
    ],
    "links": []
  }
}
```

### 2026-11-07T13:56:18.976Z trackers-batch (order 2)

```json
{
  "http": 200,
  "debug_id": "f73125523906a",
  "errors": [],
  "body": {
    "tracker_identifiers": [
      {
        "transaction_id": "54R76411E0324562K",
        "tracking_number": "1Z999AA10123456784",
        "links": [
          {
            "href": "https://api-m.sandbox.paypal.com/v1/shipping/trackers/54R76411E0324562K-1Z999AA10123456784",
            "rel": "self",
            "method": "GET",
            "encType": "application/json"
          },
          {
            "href": "https://api-m.sandbox.paypal.com/v1/shipping/trackers/54R76411E0324562K-1Z999AA10123456784",
            "rel": "replace",
            "method": "PUT",
            "encType": "application/json"
          }
        ]
      }
    ],
    "errors": [],
    "links": [
      {
        "href": "https://api-m.sandbox.paypal.com/v1/shipping/trackers-batch",
        "rel": "self",
        "method": "POST",
        "encType": "application/json"
      }
    ]
  }
}
```

### 2026-11-07T13:56:19.960Z webhooks on app

```json
{
  "http": 200,
  "webhooks": []
}
```

### 2026-11-07 manual notes (buyer checkout, US personal sealed-buyer-us)
- Sandbox personal account created with $20,000 balance and "Verified bank account: No", but checkout still shows CREDIT UNION 1 checking ••6397 and Visa ••4019. PayPal balance is listed as "Unavailable at this time", so balance-only funding is not possible from this account.
- Funding used: order 1 (3BT80782H44473250) and 3 (66425252S3919764L) bank; order 2 (75937975HE002722M) and 4 (4VW842936V560801J) Visa.
- Ship-to from buyer profile: 2211 N First St, San Jose, CA 95131.
- All four captures came back COMPLETED with seller_protection ELIGIBLE (ITEM_NOT_RECEIVED, UNAUTHORIZED_TRANSACTION) using approve-link wallet checkout.
- Orders v2 /track returned 201 and GET /v1/shipping/trackers?transaction_id= read it back. trackers-batch also returned 200 with errors [].
- No webhooks registered on the app yet.

### 2026-11-07 INR cases opened from buyer Resolution Center (about 21:58 to 22:02 Thai)
| Order | Buyer txn | Seller capture | Funding | Tracking pushed | Case ID |
|---|---|---|---|---|---|
| 1 3BT80782H44473250 $780 | 6PX93998VT781561R | 3RT3805171183213T | bank | USPS via Orders /track | PP-R-EHT-10196991 |
| 2 75937975HE002722M $780 | 99M14303T86568826 | 54R76411E0324562K | Visa | UPS via trackers-batch | PP-R-JTB-10196992 |
| 3 66425252S3919764L $640 | 2GB15831HG977535H | 9JN43155RM2635829 | bank | none | PP-R-SQX-10196993 |
| 4 4VW842936V560801J $11.50 | (not read) | 6CH777787A478920W | Visa | none | spare, no case |

- Path: buyer Activity, transaction details, "Report a problem" opens /resolutioncenter/filing/{buyer_txn_id}. The page for order 1 showed "Here's the tracking info for your order" with the USPS number we pushed through the API, before letting the buyer continue. Good shot for the video.
- Flow: I haven't received the item, Physical product / Computer, "The item hasn't reached me", expected refund, submit. Respond-by date shown: 27 Nov 2026.
- Right after filing, GET /v1/customer/disputes from the seller app returned 200 with an empty list (debug_id f86571396cb80). Expect the 10 to 30 min list lag other teams reported; check again later.
- Buyer transaction IDs only appear in the buyer's Activity view, as other teams reported.

### 2026-11-07 22:55 Thai: dispute stages after about 1 h

| Case | Funding | Tracking before case | Stage | Status |
|---|---|---|---|---|
| PP-R-EHT-10196991 | bank | USPS via Orders /track | CHARGEBACK | UNDER_REVIEW |
| PP-R-JTB-10196992 | Visa | UPS via trackers-batch | CHARGEBACK | UNDER_REVIEW |
| PP-R-SQX-10196993 | bank | none | INQUIRY | WAITING_FOR_SELLER_RESPONSE |

- Bank funding alone did not keep a case in INQUIRY: EHT (bank) is CHARGEBACK. Only the untracked case stayed INQUIRY.
- Every capture with an open case flipped from COMPLETED to PENDING with `status_details.reason: BUYER_COMPLAINT`. The spare capture 6CH777787A478920W (no case) is still COMPLETED.
- GET /v1/customer/disputes listed all three about 50 min after filing (it was empty right after).

### 2026-11-07 23:30 Thai: packing bench, EasyPost and free vision models

- EasyPost test labels (USPS Priority, 1200x1800 PNG) print "VOID" over every barcode and show `9405 0000 0000 0000 0000 00` as the tracking number. The real test tracking code (for example 9405500208192110884461) only comes back in the API response, and it passes the USPS mod-10 check. So barcode decoding cannot work on test labels; the sample buttons carry their API tracking codes.
- The made-up Day-0 number 9400111899223197428490 fails the USPS check digit, and PayPal sandbox accepted it on /track anyway.
- Orders v2 /track with an EasyPost test code: 201, and GET /v1/shipping/trackers?transaction_id= lists it as SHIPPED straight away. Several trackers on one capture are all listed.
- Free vision: OpenRouter nvidia/nemotron-3.5-super-vl:free read both sample labels correctly in about 10 s (ZIP+4 included). Gemini free tier: gemini-flash-lite-latest with reasoning_effort low took about 2 s; gemini-flash-latest took 80 to 99 s.
- Production run on https://sealed-silk.vercel.app: wrong-address sample blocked in 8.9 s, reprint to 95131-2021, tracking pushed and read back.

### 2026-11-08 01:00 Thai: dispute agent, refund-and-rebill, phone-style label photos

- GET dispute on PP-R-SQX-10196993 (INQUIRY, WAITING_FOR_SELLER_RESPONSE): evidences[] has PROOF_OF_FULFILLMENT with source REQUESTED_FROM_SELLER, added about 3 min after filing. Links: accept_claim, provide_evidence, send_message, escalate, make_offer.
- The two CHARGEBACK cases (EHT, JTB) only offer accept_claim and provide_supporting_info.
- provide-supporting-info on PP-R-EHT-10196991, multipart with an `input` JSON part `{notes}` and a PDF in a part named `supporting document`: HTTP 200, debug_id ca56e2ccca986. GET right after shows supporting_info[0] with the notes, the document name and a sandbox download URL, source SUBMITTED_BY_SELLER. Stage and status unchanged (CHARGEBACK, UNDER_REVIEW).
- Free model notes: the first draft for EHT said "the label was checked against the Transaction Details address", but that order has no packing record. The notes are now rejected and replaced by a template when they claim a label check that was not recorded, claim delivery without a DELIVERED tracker, or leave out the tracking number or ZIP.
- Refund-and-rebill on the spare capture 6CH777787A478920W ($11.50): refund 23E40083SR366924K COMPLETED, new checkout 88N18540V1500720S created with the same item.
- Label photos: a 4x6 test label composited onto a real box photo (Wikimedia Commons, "Sealing a package with plastic tape for shipping", Meanwell Packaging, CC BY 2.0). zxing-js could not find the Code 128 start pattern when a black label frame shared the barcode rows, or when bars were resampled to fractional widths; zxing-cpp read both. Without the frame and with whole-pixel modules, zxing-js reads `42095131` + the tracking number and the bench records "from the barcode". When the barcode fails, the model's reading of the printed digits is used only if it passes the USPS check digit.

### 2026-11-08 01:00 to 01:25 Thai: one clean run on production, sale to filed evidence

| Time (UTC, 7 Nov) | Step | IDs |
|---|---|---|
| 18:03 | Sale created on sealed-silk.vercel.app, sandbox buyer paid (bank) | order 1CF72500HD2101448, capture 7DB592727C937090F, ELIGIBLE |
| 18:07 | Phone-style photo of a label to the buyer's DM address: blocked (barcode read, ZIP 94105 vs 95131) | photo SHA-256 20311b42... |
| 18:07 | Reprint to the PayPal address (EasyPost test), tracking pushed with Orders /track and read back | 9405500208192110885741, push debug_id f17718666e083 |
| 18:16 | Buyer opened Item Not Received in Resolution Center. The filing page first showed the buyer our USPS number | PP-R-JPW-10197024 |
| 18:17 to 18:19 | GET by id: INQUIRY OPEN, then INQUIRY UNDER_REVIEW, then CHARGEBACK UNDER_REVIEW with only a `self` link | |
| 18:20 | Verified webhooks CUSTOMER.DISPUTE.CREATED (payload already says CHARGEBACK) and UPDATED; the case was attached to the sale through capture to order | |
| 18:21 | provide_supporting_info appeared; notes drafted by the free model, approved, filed with the PDF | HTTP 200, debug_id f10460246e606 |

- Third tracked case in a row that PayPal moved to CHARGEBACK within minutes. The one untracked case (SQX) is still INQUIRY with PROOF_OF_FULFILLMENT requested. So in this sandbox, tracking pushed before the case seems to send INR cases straight to CHARGEBACK, where only supporting info is accepted.
- The capture call succeeded but the GET right after still said APPROVED with no captures. syncOrder now fills the view from the capture response when the read lags.
- The provide-evidence multipart path is in the code but has not been filed live; the only case offering it (SQX) has no tracking to send.

### 2026-11-11 11:00 Thai: second production run, screen-recorded for the demo video

- Sale 7LY41912WA010812U, capture 2Y026920XY225153U (COMPLETED, ELIGIBLE). Photo of the box labeled to the DM address blocked, read from the barcode; reprinted to 95131-2021; USPS 9405500208192110954621 pushed with Orders /track (debug_id f27852516725b) and read back SHIPPED.
- Buyer filed Item Not Received at 04:10 UTC: PP-R-SZF-10198750. GET by id: INQUIRY OPEN, then INQUIRY UNDER_REVIEW, then CHARGEBACK UNDER_REVIEW with only `self`. CUSTOMER.DISPUTE.CREATED (already CHARGEBACK in the payload) arrived 04:13:36, UPDATED 04:14:04, both verified; provide_supporting_info appeared a few minutes later.
- Notes drafted by nvidia/nemotron-3.5-super-vl:free said the first label failed the check and was reprinted, as the prompt now asks. Filed with the PDF: provide-supporting-info HTTP 200, debug_id ca58a7e138a21.
- Fourth tracked case in a row moved to CHARGEBACK within minutes.
- PayPal's sandbox sign-in page follows the IP country (Thai here) even with an en-US browser locale; `?locale.x=en_US` on the sign-in URL switches it.
