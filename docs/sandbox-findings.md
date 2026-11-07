
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
