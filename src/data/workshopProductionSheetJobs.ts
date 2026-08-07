import type { ProductionJob } from '../types/production'
import { calculateDueStatus } from '../utils/dueStatus'

const generatedJobs: ProductionJob[] = [
  {
    "id": "WPS-6491d7cb",
    "orderNumber": "WPS-6491d7cb",
    "customerName": "Marian Scalise",
    "artworkTitle": "Crystal Path",
    "productType": "TEXTURED_REPLICA_3D",
    "width": 36,
    "height": 48,
    "frameInfo": "Black",
    "dueDate": "2026-08-11",
    "dueStatus": "AT_RISK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "Red note indicated in source workbook.",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "WAITING",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "WAITING",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 75,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-11",
    "redNotes": "Red note indicated in source workbook.",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 7,
      "sourceRecordId": "WPS-6491d7cb",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A7",
          "value": 46245,
          "formatted": "Tue, Aug 11",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "B": {
          "address": "B7",
          "value": 5,
          "formatted": "5",
          "formula": "A7-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "D": {
          "address": "D7",
          "value": 46231,
          "formatted": "2026-07-28",
          "formula": "A7-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "G": {
          "address": "G7",
          "value": "Marian Scalise (Red Note)",
          "formatted": "Marian Scalise (Red Note)",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "H": {
          "address": "H7",
          "value": "Crystal Path",
          "formatted": "Crystal Path",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "I": {
          "address": "I7",
          "value": "36 x 48",
          "formatted": "36 x 48",
          "formula": "MIN(N7:O7)&\" x \"&MAX(N7:O7)",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "J": {
          "address": "J7",
          "value": "Black",
          "formatted": "Black",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "K": {
          "address": "K7",
          "value": 15,
          "formatted": "15",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "L": {
          "address": "L7",
          "value": 4080,
          "formatted": "$4,080.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "M": {
          "address": "M7",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "N": {
          "address": "N7",
          "value": 36,
          "formatted": "36",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "O": {
          "address": "O7",
          "value": 48,
          "formatted": "48",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "P": {
          "address": "P7",
          "value": "2 3D Lim",
          "formatted": "2 3D Lim",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "V": {
          "address": "V7",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "W": {
          "address": "W7",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "X": {
          "address": "X7",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG7:BH7)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Y": {
          "address": "Y7",
          "value": 23,
          "formatted": "#REF!",
          "formula": "IF(U7>165,\"CRATE\",IF(J7=\"Rolled\",IF((MIN(N7:O7)+5)<22,\"S-14048\",IF((MIN(N7:O7)+5)<34,\"S-14049\",IF((MIN(N7:O7)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Z": {
          "address": "Z7",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA7",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB7",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC7",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD7",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AE": {
          "address": "AE7",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AF": {
          "address": "AF7",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-d0ab7a2b",
    "orderNumber": "WPS-d0ab7a2b",
    "customerName": "Terry Gage",
    "artworkTitle": "Hood Tulips",
    "productType": "TEXTURED_REPLICA_3D",
    "width": 14,
    "height": 11,
    "frameInfo": "Gold Plein",
    "dueDate": "2026-08-12",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "WAITING",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "WAITING",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 75,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-12",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 8,
      "sourceRecordId": "WPS-d0ab7a2b",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A8",
          "value": 46246,
          "formatted": "Wed, Aug 12",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "B": {
          "address": "B8",
          "value": 6,
          "formatted": "6",
          "formula": "A8-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "D": {
          "address": "D8",
          "value": 46232,
          "formatted": "2026-07-29",
          "formula": "A8-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "G": {
          "address": "G8",
          "value": "Terry Gage",
          "formatted": "Terry Gage",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "H": {
          "address": "H8",
          "value": "Hood Tulips",
          "formatted": "Hood Tulips",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "I": {
          "address": "I8",
          "value": "14 x 11",
          "formatted": "14 x 11",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "J": {
          "address": "J8",
          "value": "Gold Plein",
          "formatted": "Gold Plein",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "K": {
          "address": "K8",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "L": {
          "address": "L8",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "M": {
          "address": "M8",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "N": {
          "address": "N8",
          "value": 14,
          "formatted": "14",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "O": {
          "address": "O8",
          "value": 11,
          "formatted": "11",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "P": {
          "address": "P8",
          "value": "2 3D Lim",
          "formatted": "2 3D Lim",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "V": {
          "address": "V8",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "W": {
          "address": "W8",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "X": {
          "address": "X8",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG8:BH8)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "Y": {
          "address": "Y8",
          "value": "CNC",
          "formatted": "CNC",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9EAD3"
            },
            "bgColor": {
              "rgb": "D9EAD3"
            }
          }
        },
        "Z": {
          "address": "Z8",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA8",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB8",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC8",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD8",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE8",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF8",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-b2325ed1",
    "orderNumber": "WPS-b2325ed1",
    "customerName": "Rick Lange",
    "artworkTitle": "New York Light",
    "productType": "ORIGINAL",
    "width": 32,
    "height": 48,
    "frameInfo": "Gold EH A",
    "dueDate": "2026-08-13",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "Red note indicated in source workbook.",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "COMPLETE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-13",
    "redNotes": "Red note indicated in source workbook.",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 9,
      "sourceRecordId": "WPS-b2325ed1",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A9",
          "value": 46247,
          "formatted": "Thu, Aug 13",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "B": {
          "address": "B9",
          "value": 7,
          "formatted": "7",
          "formula": "A9-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "D": {
          "address": "D9",
          "value": 46233,
          "formatted": "2026-07-30",
          "formula": "A9-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "G": {
          "address": "G9",
          "value": "Rick Lange (Red Note)",
          "formatted": "Rick Lange (Red Note)",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "H": {
          "address": "H9",
          "value": "New York Light",
          "formatted": "New York Light",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "I": {
          "address": "I9",
          "value": "32 x 48",
          "formatted": "32 x 48",
          "formula": "MIN(N9:O9)&\" x \"&MAX(N9:O9)",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "J": {
          "address": "J9",
          "value": "Gold EH A",
          "formatted": "Gold EH A",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "K": {
          "address": "K9",
          "value": 8,
          "formatted": "8",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "L": {
          "address": "L9",
          "value": 26000,
          "formatted": "$26,000.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "M": {
          "address": "M9",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "N": {
          "address": "N9",
          "value": 32,
          "formatted": "32",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "O": {
          "address": "O9",
          "value": 48,
          "formatted": "48",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "P": {
          "address": "P9",
          "value": "1 Orig",
          "formatted": "1 Orig",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "V": {
          "address": "V9",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "W": {
          "address": "W9",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "X": {
          "address": "X9",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG9:BH9)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "Y": {
          "address": "Y9",
          "value": 23,
          "formatted": "#REF!",
          "formula": "IF(U9>165,\"CRATE\",IF(J9=\"Rolled\",IF((MIN(N9:O9)+5)<22,\"S-14048\",IF((MIN(N9:O9)+5)<34,\"S-14049\",IF((MIN(N9:O9)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "Z": {
          "address": "Z9",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA9",
          "value": "c",
          "formatted": "c",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB9",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC9",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD9",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE9",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF9",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-82368520",
    "orderNumber": "WPS-82368520",
    "customerName": "Gallery Inventory",
    "artworkTitle": "Scarlet Poppies",
    "productType": "ORIGINAL",
    "width": 72,
    "height": 96,
    "frameInfo": "Gold EH A",
    "dueDate": "2026-08-13",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "COMPLETE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-13",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 10,
      "sourceRecordId": "WPS-82368520",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A10",
          "value": 46247,
          "formatted": "Thu, Aug 13",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "B": {
          "address": "B10",
          "value": 7,
          "formatted": "7",
          "formula": "A10-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "D": {
          "address": "D10",
          "value": 46233,
          "formatted": "2026-07-30",
          "formula": "A10-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "G": {
          "address": "G10",
          "value": "Gallery Inventory",
          "formatted": "Gallery Inventory",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "H": {
          "address": "H10",
          "value": "Scarlet Poppies",
          "formatted": "Scarlet Poppies",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "I": {
          "address": "I10",
          "value": "72 x 96",
          "formatted": "72 x 96",
          "formula": "MIN(N10:O10)&\" x \"&MAX(N10:O10)",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "J": {
          "address": "J10",
          "value": "Gold EH A",
          "formatted": "Gold EH A",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "K": {
          "address": "K10",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "L": {
          "address": "L10",
          "value": 138000,
          "formatted": "$138,000.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "M": {
          "address": "M10",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "N": {
          "address": "N10",
          "value": 72,
          "formatted": "72",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "O": {
          "address": "O10",
          "value": 96,
          "formatted": "96",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "P": {
          "address": "P10",
          "value": "1 Orig",
          "formatted": "1 Orig",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "V": {
          "address": "V10",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "W": {
          "address": "W10",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "X": {
          "address": "X10",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG10:BH10)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "Y": {
          "address": "Y10",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "Z": {
          "address": "Z10",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA10",
          "value": "c",
          "formatted": "c",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB10",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC10",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD10",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE2F3"
            },
            "bgColor": {
              "rgb": "CFE2F3"
            }
          }
        },
        "AE": {
          "address": "AE10",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE2F3"
            },
            "bgColor": {
              "rgb": "CFE2F3"
            }
          }
        },
        "AF": {
          "address": "AF10",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE2F3"
            },
            "bgColor": {
              "rgb": "CFE2F3"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-065e9b62",
    "orderNumber": "WPS-065e9b62",
    "customerName": "Gallery Inventory",
    "artworkTitle": "Sunflowers on Red",
    "productType": "ORIGINAL",
    "width": 40,
    "height": 50,
    "frameInfo": "Gold EH A",
    "dueDate": "2026-08-13",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "COMPLETE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-13",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 11,
      "sourceRecordId": "WPS-065e9b62",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A11",
          "value": 46247,
          "formatted": "Thu, Aug 13",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "B": {
          "address": "B11",
          "value": 7,
          "formatted": "7",
          "formula": "A11-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "D": {
          "address": "D11",
          "value": 46233,
          "formatted": "2026-07-30",
          "formula": "A11-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "G": {
          "address": "G11",
          "value": "Gallery Inventory",
          "formatted": "Gallery Inventory",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "H": {
          "address": "H11",
          "value": "Sunflowers on Red",
          "formatted": "Sunflowers on Red",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "I": {
          "address": "I11",
          "value": "40 x 50",
          "formatted": "40 x 50",
          "formula": "MIN(N11:O11)&\" x \"&MAX(N11:O11)",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "J": {
          "address": "J11",
          "value": "Gold EH A",
          "formatted": "Gold EH A",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "K": {
          "address": "K11",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "L": {
          "address": "L11",
          "value": 34000,
          "formatted": "$34,000.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "M": {
          "address": "M11",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "N": {
          "address": "N11",
          "value": 40,
          "formatted": "40",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "O": {
          "address": "O11",
          "value": 50,
          "formatted": "50",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "P": {
          "address": "P11",
          "value": "1 Orig",
          "formatted": "1 Orig",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "V": {
          "address": "V11",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "W": {
          "address": "W11",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "X": {
          "address": "X11",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG11:BH11)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "Y": {
          "address": "Y11",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "Z": {
          "address": "Z11",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA11",
          "value": "c",
          "formatted": "c",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB11",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC11",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD11",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE11",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF11",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-57bc50cc",
    "orderNumber": "WPS-57bc50cc",
    "customerName": "Gallery Inventory",
    "artworkTitle": "Central Park Skyline",
    "productType": "ORIGINAL",
    "width": 48,
    "height": 60,
    "frameInfo": "Silver EH",
    "dueDate": "2026-08-13",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "COMPLETE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-13",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 12,
      "sourceRecordId": "WPS-57bc50cc",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A12",
          "value": 46247,
          "formatted": "Thu, Aug 13",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "B": {
          "address": "B12",
          "value": 7,
          "formatted": "7",
          "formula": "A12-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "D": {
          "address": "D12",
          "value": 46233,
          "formatted": "2026-07-30",
          "formula": "A12-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "G": {
          "address": "G12",
          "value": "Gallery Inventory",
          "formatted": "Gallery Inventory",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "H": {
          "address": "H12",
          "value": "Central Park Skyline",
          "formatted": "Central Park Skyline",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "I": {
          "address": "I12",
          "value": "48 x 60",
          "formatted": "48 x 60",
          "formula": "MIN(N12:O12)&\" x \"&MAX(N12:O12)",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "J": {
          "address": "J12",
          "value": "Silver EH",
          "formatted": "Silver EH",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "K": {
          "address": "K12",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "L": {
          "address": "L12",
          "value": 48900,
          "formatted": "$48,900.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "M": {
          "address": "M12",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "N": {
          "address": "N12",
          "value": 48,
          "formatted": "48",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "O": {
          "address": "O12",
          "value": 60,
          "formatted": "60",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "P": {
          "address": "P12",
          "value": "1 Orig",
          "formatted": "1 Orig",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "V": {
          "address": "V12",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "W": {
          "address": "W12",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "X": {
          "address": "X12",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG12:BH12)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "Y": {
          "address": "Y12",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "CFE1FC"
            },
            "bgColor": {
              "rgb": "CFE1FC"
            }
          }
        },
        "Z": {
          "address": "Z12",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA12",
          "value": "c",
          "formatted": "c",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB12",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC12",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD12",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE12",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF12",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-5482fb4b",
    "orderNumber": "WPS-5482fb4b",
    "customerName": "Deb White",
    "artworkTitle": "Coins of Light",
    "productType": "CANVAS",
    "width": 30,
    "height": 46,
    "frameInfo": "Stretched",
    "dueDate": "2026-08-14",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-14",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 13,
      "sourceRecordId": "WPS-5482fb4b",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A13",
          "value": 46248,
          "formatted": "Fri, Aug 14",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "B": {
          "address": "B13",
          "value": 8,
          "formatted": "8",
          "formula": "A13-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "D": {
          "address": "D13",
          "value": 46234,
          "formatted": "2026-07-31",
          "formula": "A13-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "G": {
          "address": "G13",
          "value": "Deb White",
          "formatted": "Deb White",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "H": {
          "address": "H13",
          "value": "Coins of Light",
          "formatted": "Coins of Light",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "I": {
          "address": "I13",
          "value": "30 x 46",
          "formatted": "30 x 46",
          "formula": "MIN(N13:O13)&\" x \"&MAX(N13:O13)",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "J": {
          "address": "J13",
          "value": "Stretched",
          "formatted": "Stretched",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "K": {
          "address": "K13",
          "value": 211,
          "formatted": "211",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "L": {
          "address": "L13",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "M": {
          "address": "M13",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "N": {
          "address": "N13",
          "value": 30,
          "formatted": "30",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "O": {
          "address": "O13",
          "value": 46,
          "formatted": "46",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "P": {
          "address": "P13",
          "value": "3 Canv",
          "formatted": "3 Canv",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "V": {
          "address": "V13",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "W": {
          "address": "W13",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "X": {
          "address": "X13",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG13:BH13)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Y": {
          "address": "Y13",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Z": {
          "address": "Z13",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AA": {
          "address": "AA13",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AB": {
          "address": "AB13",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AC": {
          "address": "AC13",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AD": {
          "address": "AD13",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE13",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AF": {
          "address": "AF13",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-447b1a0a",
    "orderNumber": "WPS-447b1a0a",
    "customerName": "Kathy McGee",
    "artworkTitle": "Setting Sun",
    "productType": "CANVAS",
    "width": 23,
    "height": 15,
    "frameInfo": "Rolled",
    "dueDate": "2026-08-15",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-15",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 14,
      "sourceRecordId": "WPS-447b1a0a",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A14",
          "value": 46249,
          "formatted": "Sat, Aug 15",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "B": {
          "address": "B14",
          "value": 9,
          "formatted": "9",
          "formula": "A14-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "D": {
          "address": "D14",
          "value": 46235,
          "formatted": "2026-08-01",
          "formula": "A14-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "G": {
          "address": "G14",
          "value": "Kathy McGee",
          "formatted": "Kathy McGee",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "H": {
          "address": "H14",
          "value": "Setting Sun",
          "formatted": "Setting Sun",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "I": {
          "address": "I14",
          "value": "15 x 23",
          "formatted": "15 x 23",
          "formula": "MIN(N14:O14)&\" x \"&MAX(N14:O14)",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "J": {
          "address": "J14",
          "value": "Rolled",
          "formatted": "Rolled",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "K": {
          "address": "K14",
          "value": 211,
          "formatted": "211",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "L": {
          "address": "L14",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "M": {
          "address": "M14",
          "value": "0.00*",
          "formatted": "0.00*",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "N": {
          "address": "N14",
          "value": 23,
          "formatted": "23",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "O": {
          "address": "O14",
          "value": 15,
          "formatted": "15",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "P": {
          "address": "P14",
          "value": "3 Canv",
          "formatted": "3 Canv",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "V": {
          "address": "V14",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "W": {
          "address": "W14",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "X": {
          "address": "X14",
          "value": 0.044444444444444446,
          "formatted": "1:04",
          "formula": "SUM(AG14:BH14)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Y": {
          "address": "Y14",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Z": {
          "address": "Z14",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AA": {
          "address": "AA14",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AB": {
          "address": "AB14",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC14",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD14",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE14",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF14",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-4984235e",
    "orderNumber": "WPS-4984235e",
    "customerName": "Kathy McGee",
    "artworkTitle": "Aspen Forest",
    "productType": "CANVAS",
    "width": 15,
    "height": 25,
    "frameInfo": "Rolled",
    "dueDate": "2026-08-15",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-15",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 15,
      "sourceRecordId": "WPS-4984235e",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A15",
          "value": 46249,
          "formatted": "Sat, Aug 15",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "B": {
          "address": "B15",
          "value": 9,
          "formatted": "9",
          "formula": "A15-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "D": {
          "address": "D15",
          "value": 46235,
          "formatted": "2026-08-01",
          "formula": "A15-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "G": {
          "address": "G15",
          "value": "Kathy McGee",
          "formatted": "Kathy McGee",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "H": {
          "address": "H15",
          "value": "Aspen Forest",
          "formatted": "Aspen Forest",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "I": {
          "address": "I15",
          "value": "15 x 25",
          "formatted": "15 x 25",
          "formula": "MIN(N15:O15)&\" x \"&MAX(N15:O15)",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "J": {
          "address": "J15",
          "value": "Rolled",
          "formatted": "Rolled",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "K": {
          "address": "K15",
          "value": 211,
          "formatted": "211",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "L": {
          "address": "L15",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "M": {
          "address": "M15",
          "value": "0.00*",
          "formatted": "0.00*",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "N": {
          "address": "N15",
          "value": 15,
          "formatted": "15",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "O": {
          "address": "O15",
          "value": 25,
          "formatted": "25",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "P": {
          "address": "P15",
          "value": "3 Canv",
          "formatted": "3 Canv",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "V": {
          "address": "V15",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "W": {
          "address": "W15",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "X": {
          "address": "X15",
          "value": 0.044444444444444446,
          "formatted": "1:04",
          "formula": "SUM(AG15:BH15)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Y": {
          "address": "Y15",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Z": {
          "address": "Z15",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AA": {
          "address": "AA15",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AB": {
          "address": "AB15",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC15",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD15",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE15",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF15",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-d8ea1ce0",
    "orderNumber": "WPS-d8ea1ce0",
    "customerName": "Mark Warnquist",
    "artworkTitle": "Ocotillos and Blooms",
    "productType": "CANVAS",
    "width": 39,
    "height": 30,
    "frameInfo": "Stretched",
    "dueDate": "2026-08-16",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-16",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 16,
      "sourceRecordId": "WPS-d8ea1ce0",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A16",
          "value": 46250,
          "formatted": "Sun, Aug 16",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "B": {
          "address": "B16",
          "value": 10,
          "formatted": "10",
          "formula": "A16-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "D": {
          "address": "D16",
          "value": 46236,
          "formatted": "2026-08-02",
          "formula": "A16-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "G": {
          "address": "G16",
          "value": "Mark Warnquist",
          "formatted": "Mark Warnquist",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "H": {
          "address": "H16",
          "value": "Ocotillos and Blooms",
          "formatted": "Ocotillos and Blooms",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "I": {
          "address": "I16",
          "value": "30 x 39",
          "formatted": "30 x 39",
          "formula": "MIN(N16:O16)&\" x \"&MAX(N16:O16)",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "J": {
          "address": "J16",
          "value": "Stretched",
          "formatted": "Stretched",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "K": {
          "address": "K16",
          "value": 211,
          "formatted": "211",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "L": {
          "address": "L16",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "M": {
          "address": "M16",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "N": {
          "address": "N16",
          "value": 39,
          "formatted": "39",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "O": {
          "address": "O16",
          "value": 30,
          "formatted": "30",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "P": {
          "address": "P16",
          "value": "3 Canv",
          "formatted": "3 Canv",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "V": {
          "address": "V16",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "W": {
          "address": "W16",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "X": {
          "address": "X16",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG16:BH16)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Y": {
          "address": "Y16",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Z": {
          "address": "Z16",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AA": {
          "address": "AA16",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AB": {
          "address": "AB16",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AC": {
          "address": "AC16",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AD": {
          "address": "AD16",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE16",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AF": {
          "address": "AF16",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-f2f9d3aa",
    "orderNumber": "WPS-f2f9d3aa",
    "customerName": "George & Liz  Hammond Goodrich",
    "artworkTitle": "Joshua Hues",
    "productType": "CANVAS",
    "width": 30,
    "height": 36,
    "frameInfo": "Rolled",
    "dueDate": "2026-08-18",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-18",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 17,
      "sourceRecordId": "WPS-f2f9d3aa",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A17",
          "value": 46252,
          "formatted": "Tue, Aug 18",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "B": {
          "address": "B17",
          "value": 12,
          "formatted": "12",
          "formula": "A17-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "D": {
          "address": "D17",
          "value": 46238,
          "formatted": "2026-08-04",
          "formula": "A17-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "G": {
          "address": "G17",
          "value": "George & Liz  Hammond Goodrich",
          "formatted": "George & Liz  Hammond Goodrich",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "H": {
          "address": "H17",
          "value": "Joshua Hues",
          "formatted": "Joshua Hues",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "I": {
          "address": "I17",
          "value": "30 x 36",
          "formatted": "30 x 36",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "J": {
          "address": "J17",
          "value": "Rolled",
          "formatted": "Rolled",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "K": {
          "address": "K17",
          "value": 211,
          "formatted": "211",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "L": {
          "address": "L17",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "M": {
          "address": "M17",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "N": {
          "address": "N17",
          "value": 30,
          "formatted": "30",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "O": {
          "address": "O17",
          "value": 36,
          "formatted": "36",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "P": {
          "address": "P17",
          "value": "3 Canv",
          "formatted": "3 Canv",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "V": {
          "address": "V17",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "W": {
          "address": "W17",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "X": {
          "address": "X17",
          "value": 0.044444444444444446,
          "formatted": "1:04",
          "formula": "SUM(AG17:BH17)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Y": {
          "address": "Y17",
          "value": "S-5574",
          "formatted": "S-5574",
          "formula": "IF(U17>165,\"CRATE\",IF(J17=\"Rolled\",IF((MIN(N17:O17)+5)<22,\"S-14048\",IF((MIN(N17:O17)+5)<34,\"S-14049\",IF((MIN(N17:O17)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Z": {
          "address": "Z17",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AA": {
          "address": "AA17",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AB": {
          "address": "AB17",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC17",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD17",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE17",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF17",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-1e95fd70",
    "orderNumber": "WPS-1e95fd70",
    "customerName": "George & Liz  Hammond Goodrich",
    "artworkTitle": "La Quinta Light",
    "productType": "CANVAS",
    "width": 36,
    "height": 45,
    "frameInfo": "Rolled",
    "dueDate": "2026-08-18",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-18",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 18,
      "sourceRecordId": "WPS-1e95fd70",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A18",
          "value": 46252,
          "formatted": "Tue, Aug 18",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "B": {
          "address": "B18",
          "value": 12,
          "formatted": "12",
          "formula": "A18-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "D": {
          "address": "D18",
          "value": 46238,
          "formatted": "2026-08-04",
          "formula": "A18-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "G": {
          "address": "G18",
          "value": "George & Liz  Hammond Goodrich",
          "formatted": "George & Liz  Hammond Goodrich",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "H": {
          "address": "H18",
          "value": "La Quinta Light",
          "formatted": "La Quinta Light",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "I": {
          "address": "I18",
          "value": "36 x 45",
          "formatted": "36 x 45",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "J": {
          "address": "J18",
          "value": "Rolled",
          "formatted": "Rolled",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "K": {
          "address": "K18",
          "value": 211,
          "formatted": "211",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "L": {
          "address": "L18",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "M": {
          "address": "M18",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "N": {
          "address": "N18",
          "value": 36,
          "formatted": "36",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "O": {
          "address": "O18",
          "value": 45,
          "formatted": "45",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "P": {
          "address": "P18",
          "value": "3 Canv",
          "formatted": "3 Canv",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "V": {
          "address": "V18",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "W": {
          "address": "W18",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "X": {
          "address": "X18",
          "value": 0.044444444444444446,
          "formatted": "1:04",
          "formula": "SUM(AG18:BH18)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Y": {
          "address": "Y18",
          "value": "S-5574",
          "formatted": "S-5574",
          "formula": "IF(U18>165,\"CRATE\",IF(J18=\"Rolled\",IF((MIN(N18:O18)+5)<22,\"S-14048\",IF((MIN(N18:O18)+5)<34,\"S-14049\",IF((MIN(N18:O18)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Z": {
          "address": "Z18",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AA": {
          "address": "AA18",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AB": {
          "address": "AB18",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC18",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD18",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE18",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF18",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-1ad4d476",
    "orderNumber": "WPS-1ad4d476",
    "customerName": "George & Liz  Hammond Goodrich",
    "artworkTitle": "Emerald Oasis",
    "productType": "CANVAS",
    "width": 46,
    "height": 30,
    "frameInfo": "Rolled",
    "dueDate": "2026-08-18",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-18",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 19,
      "sourceRecordId": "WPS-1ad4d476",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A19",
          "value": 46252,
          "formatted": "Tue, Aug 18",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "B": {
          "address": "B19",
          "value": 12,
          "formatted": "12",
          "formula": "A19-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "D": {
          "address": "D19",
          "value": 46238,
          "formatted": "2026-08-04",
          "formula": "A19-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "G": {
          "address": "G19",
          "value": "George & Liz  Hammond Goodrich",
          "formatted": "George & Liz  Hammond Goodrich",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "H": {
          "address": "H19",
          "value": "Emerald Oasis",
          "formatted": "Emerald Oasis",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "I": {
          "address": "I19",
          "value": "46 x 30",
          "formatted": "46 x 30",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "J": {
          "address": "J19",
          "value": "Rolled",
          "formatted": "Rolled",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "K": {
          "address": "K19",
          "value": 211,
          "formatted": "211",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "L": {
          "address": "L19",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "M": {
          "address": "M19",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "N": {
          "address": "N19",
          "value": 46,
          "formatted": "46",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "O": {
          "address": "O19",
          "value": 30,
          "formatted": "30",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "P": {
          "address": "P19",
          "value": "3 Canv",
          "formatted": "3 Canv",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "V": {
          "address": "V19",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "W": {
          "address": "W19",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "X": {
          "address": "X19",
          "value": 0.044444444444444446,
          "formatted": "1:04",
          "formula": "SUM(AG19:BH19)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Y": {
          "address": "Y19",
          "value": "S-5574",
          "formatted": "S-5574",
          "formula": "IF(U19>165,\"CRATE\",IF(J19=\"Rolled\",IF((MIN(N19:O19)+5)<22,\"S-14048\",IF((MIN(N19:O19)+5)<34,\"S-14049\",IF((MIN(N19:O19)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Z": {
          "address": "Z19",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AA": {
          "address": "AA19",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AB": {
          "address": "AB19",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC19",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD19",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE19",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF19",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-7dcb9a0f",
    "orderNumber": "WPS-7dcb9a0f",
    "customerName": "Sam Hawkins",
    "artworkTitle": "Billows of Light",
    "productType": "CANVAS",
    "width": 26,
    "height": 48,
    "frameInfo": "Rolled",
    "dueDate": "2026-08-18",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-18",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 20,
      "sourceRecordId": "WPS-7dcb9a0f",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A20",
          "value": 46252,
          "formatted": "Tue, Aug 18",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "B": {
          "address": "B20",
          "value": 12,
          "formatted": "12",
          "formula": "A20-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "D": {
          "address": "D20",
          "value": 46238,
          "formatted": "2026-08-04",
          "formula": "A20-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "G": {
          "address": "G20",
          "value": "Sam Hawkins",
          "formatted": "Sam Hawkins",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "H": {
          "address": "H20",
          "value": "Billows of Light",
          "formatted": "Billows of Light",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "I": {
          "address": "I20",
          "value": "26 x 48",
          "formatted": "26 x 48",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "J": {
          "address": "J20",
          "value": "Rolled",
          "formatted": "Rolled",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "K": {
          "address": "K20",
          "value": 211,
          "formatted": "211",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "L": {
          "address": "L20",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "M": {
          "address": "M20",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "N": {
          "address": "N20",
          "value": 26,
          "formatted": "26",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "O": {
          "address": "O20",
          "value": 48,
          "formatted": "48",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "P": {
          "address": "P20",
          "value": "3 Canv",
          "formatted": "3 Canv",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "V": {
          "address": "V20",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "W": {
          "address": "W20",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "X": {
          "address": "X20",
          "value": 0.044444444444444446,
          "formatted": "1:04",
          "formula": "SUM(AG20:BH20)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Y": {
          "address": "Y20",
          "value": "S-14049",
          "formatted": "S-14049",
          "formula": "IF(U20>165,\"CRATE\",IF(J20=\"Rolled\",IF((MIN(N20:O20)+5)<22,\"S-14048\",IF((MIN(N20:O20)+5)<34,\"S-14049\",IF((MIN(N20:O20)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "Z": {
          "address": "Z20",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AA": {
          "address": "AA20",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        },
        "AB": {
          "address": "AB20",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC20",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD20",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE20",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF20",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "FFF2CC"
            },
            "bgColor": {
              "rgb": "FFF2CC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-a573eb70",
    "orderNumber": "WPS-a573eb70",
    "customerName": "George & Liz  Hammond Goodrich",
    "artworkTitle": "Oaken Walk",
    "productType": "TEXTURED_REPLICA_3D",
    "width": 30,
    "height": 40,
    "frameInfo": "Silver REH",
    "dueDate": "2026-08-18",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "WAITING",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "WAITING",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 75,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-18",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 21,
      "sourceRecordId": "WPS-a573eb70",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A21",
          "value": 46252,
          "formatted": "Tue, Aug 18",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "B": {
          "address": "B21",
          "value": 12,
          "formatted": "12",
          "formula": "A21-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "D": {
          "address": "D21",
          "value": 46238,
          "formatted": "2026-08-04",
          "formula": "A21-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "G": {
          "address": "G21",
          "value": "George & Liz  Hammond Goodrich",
          "formatted": "George & Liz  Hammond Goodrich",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "H": {
          "address": "H21",
          "value": "Oaken Walk",
          "formatted": "Oaken Walk",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "I": {
          "address": "I21",
          "value": "30 x 40",
          "formatted": "30 x 40",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "J": {
          "address": "J21",
          "value": "Silver REH",
          "formatted": "Silver REH",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "K": {
          "address": "K21",
          "value": 10,
          "formatted": "10",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "L": {
          "address": "L21",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "M": {
          "address": "M21",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "N": {
          "address": "N21",
          "value": 30,
          "formatted": "30",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "O": {
          "address": "O21",
          "value": 40,
          "formatted": "40",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "P": {
          "address": "P21",
          "value": "2 3D Lim",
          "formatted": "2 3D Lim",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "V": {
          "address": "V21",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "W": {
          "address": "W21",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "X": {
          "address": "X21",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG21:BH21)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Y": {
          "address": "Y21",
          "value": 23,
          "formatted": "#REF!",
          "formula": "IF(U21>165,\"CRATE\",IF(J21=\"Rolled\",IF((MIN(N21:O21)+5)<22,\"S-14048\",IF((MIN(N21:O21)+5)<34,\"S-14049\",IF((MIN(N21:O21)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Z": {
          "address": "Z21",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AA": {
          "address": "AA21",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AB": {
          "address": "AB21",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AC": {
          "address": "AC21",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AD": {
          "address": "AD21",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AE": {
          "address": "AE21",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AF": {
          "address": "AF21",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-e4e47cd1",
    "orderNumber": "WPS-e4e47cd1",
    "customerName": "George & Liz  Hammond Goodrich",
    "artworkTitle": "The Path",
    "productType": "TEXTURED_REPLICA_3D",
    "width": 28,
    "height": 40,
    "frameInfo": "Silver REH",
    "dueDate": "2026-08-18",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "WAITING",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "WAITING",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 75,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-18",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 22,
      "sourceRecordId": "WPS-e4e47cd1",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A22",
          "value": 46252,
          "formatted": "Tue, Aug 18",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "B": {
          "address": "B22",
          "value": 12,
          "formatted": "12",
          "formula": "A22-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "D": {
          "address": "D22",
          "value": 46238,
          "formatted": "2026-08-04",
          "formula": "A22-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "G": {
          "address": "G22",
          "value": "George & Liz  Hammond Goodrich",
          "formatted": "George & Liz  Hammond Goodrich",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "H": {
          "address": "H22",
          "value": "The Path",
          "formatted": "The Path",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "I": {
          "address": "I22",
          "value": "28 x 40",
          "formatted": "28 x 40",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "J": {
          "address": "J22",
          "value": "Silver REH",
          "formatted": "Silver REH",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "K": {
          "address": "K22",
          "value": 22,
          "formatted": "22",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "L": {
          "address": "L22",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "M": {
          "address": "M22",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "N": {
          "address": "N22",
          "value": 28,
          "formatted": "28",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "O": {
          "address": "O22",
          "value": 40,
          "formatted": "40",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "P": {
          "address": "P22",
          "value": "2 3D Lim",
          "formatted": "2 3D Lim",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "V": {
          "address": "V22",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "W": {
          "address": "W22",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "X": {
          "address": "X22",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG22:BH22)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Y": {
          "address": "Y22",
          "value": 23,
          "formatted": "#REF!",
          "formula": "IF(U22>165,\"CRATE\",IF(J22=\"Rolled\",IF((MIN(N22:O22)+5)<22,\"S-14048\",IF((MIN(N22:O22)+5)<34,\"S-14049\",IF((MIN(N22:O22)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Z": {
          "address": "Z22",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA22",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AB": {
          "address": "AB22",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AC": {
          "address": "AC22",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AD": {
          "address": "AD22",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AE": {
          "address": "AE22",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AF": {
          "address": "AF22",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-2f2e7046",
    "orderNumber": "WPS-2f2e7046",
    "customerName": "George & Liz  Hammond Goodrich",
    "artworkTitle": "Willamette Vines",
    "productType": "TEXTURED_REPLICA_3D",
    "width": 28,
    "height": 37,
    "frameInfo": "Silver REH",
    "dueDate": "2026-08-18",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "WAITING",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "WAITING",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 75,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-18",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 23,
      "sourceRecordId": "WPS-2f2e7046",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A23",
          "value": 46252,
          "formatted": "Tue, Aug 18",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "B": {
          "address": "B23",
          "value": 12,
          "formatted": "12",
          "formula": "A23-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "D": {
          "address": "D23",
          "value": 46238,
          "formatted": "2026-08-04",
          "formula": "A23-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "G": {
          "address": "G23",
          "value": "George & Liz  Hammond Goodrich",
          "formatted": "George & Liz  Hammond Goodrich",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "H": {
          "address": "H23",
          "value": "Willamette Vines",
          "formatted": "Willamette Vines",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "I": {
          "address": "I23",
          "value": "28 x 37",
          "formatted": "28 x 37",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "J": {
          "address": "J23",
          "value": "Silver REH",
          "formatted": "Silver REH",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "K": {
          "address": "K23",
          "value": 1,
          "formatted": "1",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "L": {
          "address": "L23",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "M": {
          "address": "M23",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "N": {
          "address": "N23",
          "value": 28,
          "formatted": "28",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "O": {
          "address": "O23",
          "value": 37,
          "formatted": "37",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "P": {
          "address": "P23",
          "value": "2 3D Lim",
          "formatted": "2 3D Lim",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "V": {
          "address": "V23",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "W": {
          "address": "W23",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "X": {
          "address": "X23",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG23:BH23)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Y": {
          "address": "Y23",
          "value": 23,
          "formatted": "#REF!",
          "formula": "IF(U23>165,\"CRATE\",IF(J23=\"Rolled\",IF((MIN(N23:O23)+5)<22,\"S-14048\",IF((MIN(N23:O23)+5)<34,\"S-14049\",IF((MIN(N23:O23)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Z": {
          "address": "Z23",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AA": {
          "address": "AA23",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AB": {
          "address": "AB23",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AC": {
          "address": "AC23",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AD": {
          "address": "AD23",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AE": {
          "address": "AE23",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AF": {
          "address": "AF23",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-99190a70",
    "orderNumber": "WPS-99190a70",
    "customerName": "Stephanie Williams",
    "artworkTitle": "Coastline Dusk",
    "productType": "TEXTURED_REPLICA_3D",
    "width": 40,
    "height": 32,
    "frameInfo": "Gold REH NEW",
    "dueDate": "2026-08-18",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "WAITING",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "WAITING",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 75,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-18",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 24,
      "sourceRecordId": "WPS-99190a70",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A24",
          "value": 46252,
          "formatted": "Tue, Aug 18",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "B": {
          "address": "B24",
          "value": 12,
          "formatted": "12",
          "formula": "A24-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "D": {
          "address": "D24",
          "value": 46238,
          "formatted": "2026-08-04",
          "formula": "A24-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "G": {
          "address": "G24",
          "value": "Stephanie Williams",
          "formatted": "Stephanie Williams",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "H": {
          "address": "H24",
          "value": "Coastline Dusk",
          "formatted": "Coastline Dusk",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "I": {
          "address": "I24",
          "value": "40 x 32",
          "formatted": "40 x 32",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "J": {
          "address": "J24",
          "value": "Gold REH NEW",
          "formatted": "Gold REH NEW",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "K": {
          "address": "K24",
          "value": 4,
          "formatted": "4",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "L": {
          "address": "L24",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "M": {
          "address": "M24",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "N": {
          "address": "N24",
          "value": 40,
          "formatted": "40",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "O": {
          "address": "O24",
          "value": 32,
          "formatted": "32",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "P": {
          "address": "P24",
          "value": "2 3D Lim",
          "formatted": "2 3D Lim",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "V": {
          "address": "V24",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "W": {
          "address": "W24",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "X": {
          "address": "X24",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG24:BH24)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Y": {
          "address": "Y24",
          "value": 23,
          "formatted": "#REF!",
          "formula": "IF(U24>165,\"CRATE\",IF(J24=\"Rolled\",IF((MIN(N24:O24)+5)<22,\"S-14048\",IF((MIN(N24:O24)+5)<34,\"S-14049\",IF((MIN(N24:O24)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Z": {
          "address": "Z24",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA24",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AB": {
          "address": "AB24",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AC": {
          "address": "AC24",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AD": {
          "address": "AD24",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AE": {
          "address": "AE24",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AF": {
          "address": "AF24",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-9a748aca",
    "orderNumber": "WPS-9a748aca",
    "customerName": "Erin Hanson",
    "artworkTitle": "Gilded Lilies",
    "productType": "TEXTURED_REPLICA_3D",
    "width": 30,
    "height": 48,
    "frameInfo": "Gold REH NEW",
    "dueDate": "2026-08-18",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "WAITING",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "WAITING",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 75,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-18",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 25,
      "sourceRecordId": "WPS-9a748aca",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A25",
          "value": 46252,
          "formatted": "Tue, Aug 18",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "B": {
          "address": "B25",
          "value": 12,
          "formatted": "12",
          "formula": "A25-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "D": {
          "address": "D25",
          "value": 46238,
          "formatted": "2026-08-04",
          "formula": "A25-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "G": {
          "address": "G25",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "H": {
          "address": "H25",
          "value": "Gilded Lilies",
          "formatted": "Gilded Lilies",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "I": {
          "address": "I25",
          "value": "30 x 48",
          "formatted": "30 x 48",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "J": {
          "address": "J25",
          "value": "Gold REH NEW",
          "formatted": "Gold REH NEW",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "K": {
          "address": "K25",
          "value": 1,
          "formatted": "1",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "L": {
          "address": "L25",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "M": {
          "address": "M25",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "N": {
          "address": "N25",
          "value": 30,
          "formatted": "30",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "O": {
          "address": "O25",
          "value": 48,
          "formatted": "48",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "P": {
          "address": "P25",
          "value": "2 3D Lim",
          "formatted": "2 3D Lim",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "V": {
          "address": "V25",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "W": {
          "address": "W25",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "X": {
          "address": "X25",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG25:BH25)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Y": {
          "address": "Y25",
          "value": 23,
          "formatted": "#REF!",
          "formula": "IF(U25>165,\"CRATE\",IF(J25=\"Rolled\",IF((MIN(N25:O25)+5)<22,\"S-14048\",IF((MIN(N25:O25)+5)<34,\"S-14049\",IF((MIN(N25:O25)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Z": {
          "address": "Z25",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AA": {
          "address": "AA25",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AB": {
          "address": "AB25",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AC": {
          "address": "AC25",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AD": {
          "address": "AD25",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AE": {
          "address": "AE25",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AF": {
          "address": "AF25",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-e5994b82",
    "orderNumber": "WPS-e5994b82",
    "customerName": "Pamela Livingston",
    "artworkTitle": "California Vista II",
    "productType": "TEXTURED_REPLICA_3D",
    "width": 30,
    "height": 24,
    "frameInfo": "Gold REH NEW",
    "dueDate": "2026-08-19",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "WAITING",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "WAITING",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 75,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-19",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 26,
      "sourceRecordId": "WPS-e5994b82",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A26",
          "value": 46253,
          "formatted": "Wed, Aug 19",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "B": {
          "address": "B26",
          "value": 13,
          "formatted": "13",
          "formula": "A26-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "D": {
          "address": "D26",
          "value": 46239,
          "formatted": "2026-08-05",
          "formula": "A26-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "G": {
          "address": "G26",
          "value": "Pamela Livingston",
          "formatted": "Pamela Livingston",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "H": {
          "address": "H26",
          "value": "California Vista II",
          "formatted": "California Vista II",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "I": {
          "address": "I26",
          "value": "30 x 24",
          "formatted": "30 x 24",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "J": {
          "address": "J26",
          "value": "Gold REH NEW",
          "formatted": "Gold REH NEW",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "K": {
          "address": "K26",
          "value": 1,
          "formatted": "1",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "L": {
          "address": "L26",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "M": {
          "address": "M26",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "N": {
          "address": "N26",
          "value": 30,
          "formatted": "30",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "O": {
          "address": "O26",
          "value": 24,
          "formatted": "24",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "P": {
          "address": "P26",
          "value": "2 3D Lim",
          "formatted": "2 3D Lim",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "V": {
          "address": "V26",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "W": {
          "address": "W26",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "X": {
          "address": "X26",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG26:BH26)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Y": {
          "address": "Y26",
          "value": 23,
          "formatted": "#REF!",
          "formula": "IF(U26>165,\"CRATE\",IF(J26=\"Rolled\",IF((MIN(N26:O26)+5)<22,\"S-14048\",IF((MIN(N26:O26)+5)<34,\"S-14049\",IF((MIN(N26:O26)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Z": {
          "address": "Z26",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AA": {
          "address": "AA26",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AB": {
          "address": "AB26",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AC": {
          "address": "AC26",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AD": {
          "address": "AD26",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AE": {
          "address": "AE26",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AF": {
          "address": "AF26",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-e7c35ae8",
    "orderNumber": "WPS-e7c35ae8",
    "customerName": "Mary-Michael Robertson",
    "artworkTitle": "Willamette Vines",
    "productType": "PAPER",
    "width": 16,
    "height": 20,
    "frameInfo": "Rolled",
    "dueDate": "2026-08-19",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-19",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 27,
      "sourceRecordId": "WPS-e7c35ae8",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A27",
          "value": 46253,
          "formatted": "Wed, Aug 19",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "B": {
          "address": "B27",
          "value": 13,
          "formatted": "13",
          "formula": "A27-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "D": {
          "address": "D27",
          "value": 46239,
          "formatted": "2026-08-05",
          "formula": "A27-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "G": {
          "address": "G27",
          "value": "Mary-Michael Robertson",
          "formatted": "Mary-Michael Robertson",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "H": {
          "address": "H27",
          "value": "Willamette Vines",
          "formatted": "Willamette Vines",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "I": {
          "address": "I27",
          "value": "16 x 20",
          "formatted": "16 x 20",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "J": {
          "address": "J27",
          "value": "Rolled",
          "formatted": "Rolled",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "K": {
          "address": "K27",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "L": {
          "address": "L27",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "M": {
          "address": "M27",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "N": {
          "address": "N27",
          "value": 16,
          "formatted": "16",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "O": {
          "address": "O27",
          "value": 20,
          "formatted": "20",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "P": {
          "address": "P27",
          "value": "4 Paper",
          "formatted": "4 Paper",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "V": {
          "address": "V27",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "W": {
          "address": "W27",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "X": {
          "address": "X27",
          "value": 0,
          "formatted": "0:00",
          "formula": "SUM(AG27:BH27)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "Y": {
          "address": "Y27",
          "value": "S-14048",
          "formatted": "S-14048",
          "formula": "IF(U27>165,\"CRATE\",IF(J27=\"Rolled\",IF((MIN(N27:O27)+5)<22,\"S-14048\",IF((MIN(N27:O27)+5)<34,\"S-14049\",IF((MIN(N27:O27)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        },
        "Z": {
          "address": "Z27",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA27",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB27",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC27",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD27",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE27",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF27",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "D9D2E9"
            },
            "bgColor": {
              "rgb": "D9D2E9"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-8d7d4581",
    "orderNumber": "WPS-8d7d4581",
    "customerName": "Donald Elting",
    "artworkTitle": "Northwestern Golds",
    "productType": "TEXTURED_REPLICA_3D",
    "width": 24,
    "height": 29,
    "frameInfo": "Gold REH NEW",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "Red note indicated in source workbook.",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "WAITING",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "WAITING",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 75,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "redNotes": "Red note indicated in source workbook.",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 28,
      "sourceRecordId": "WPS-8d7d4581",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A28",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "B": {
          "address": "B28",
          "value": 25,
          "formatted": "25",
          "formula": "A28-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "D": {
          "address": "D28",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A28-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "G": {
          "address": "G28",
          "value": "Donald Elting (Red Note)",
          "formatted": "Donald Elting (Red Note)",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "H": {
          "address": "H28",
          "value": "Northwestern Golds",
          "formatted": "Northwestern Golds",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "I": {
          "address": "I28",
          "value": "24 x 29",
          "formatted": "24 x 29",
          "formula": "MIN(N28:O28)&\" x \"&MAX(N28:O28)",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "J": {
          "address": "J28",
          "value": "Gold REH NEW",
          "formatted": "Gold REH NEW",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "K": {
          "address": "K28",
          "value": 8,
          "formatted": "8",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "L": {
          "address": "L28",
          "value": 1840,
          "formatted": "$1,840.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "M": {
          "address": "M28",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "N": {
          "address": "N28",
          "value": 24,
          "formatted": "24",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "O": {
          "address": "O28",
          "value": 29,
          "formatted": "29",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "P": {
          "address": "P28",
          "value": "2 3D Lim",
          "formatted": "2 3D Lim",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "V": {
          "address": "V28",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "W": {
          "address": "W28",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "X": {
          "address": "X28",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG28:BH28)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Y": {
          "address": "Y28",
          "value": 23,
          "formatted": "#REF!",
          "formula": "IF(U28>165,\"CRATE\",IF(J28=\"Rolled\",IF((MIN(N28:O28)+5)<22,\"S-14048\",IF((MIN(N28:O28)+5)<34,\"S-14049\",IF((MIN(N28:O28)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Z": {
          "address": "Z28",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA28",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB28",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC28",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD28",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE28",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "theme": 1,
              "rgb": "000000"
            },
            "bgColor": {
              "theme": 1,
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF28",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-d3f7b75a",
    "orderNumber": "WPS-d3f7b75a",
    "customerName": "Jim (Shari) Gong",
    "artworkTitle": "Cultivated Hills",
    "productType": "TEXTURED_REPLICA_3D",
    "width": 38,
    "height": 50,
    "frameInfo": "Gold REH NEW",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "WAITING",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "WAITING",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 75,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 29,
      "sourceRecordId": "WPS-d3f7b75a",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A29",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "B": {
          "address": "B29",
          "value": 25,
          "formatted": "25",
          "formula": "A29-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "D": {
          "address": "D29",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A29-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "G": {
          "address": "G29",
          "value": "Jim (Shari) Gong",
          "formatted": "Jim (Shari) Gong",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "H": {
          "address": "H29",
          "value": "Cultivated Hills",
          "formatted": "Cultivated Hills",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "I": {
          "address": "I29",
          "value": "38 x 50",
          "formatted": "38 x 50",
          "formula": "MIN(N29:O29)&\" x \"&MAX(N29:O29)",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "J": {
          "address": "J29",
          "value": "Gold REH NEW",
          "formatted": "Gold REH NEW",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "K": {
          "address": "K29",
          "value": 8,
          "formatted": "8",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "L": {
          "address": "L29",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "M": {
          "address": "M29",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "N": {
          "address": "N29",
          "value": 38,
          "formatted": "38",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "O": {
          "address": "O29",
          "value": 50,
          "formatted": "50",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "P": {
          "address": "P29",
          "value": "2 3D Lim",
          "formatted": "2 3D Lim",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "V": {
          "address": "V29",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "W": {
          "address": "W29",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "X": {
          "address": "X29",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG29:BH29)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Y": {
          "address": "Y29",
          "value": 23,
          "formatted": "#REF!",
          "formula": "IF(U29>165,\"CRATE\",IF(J29=\"Rolled\",IF((MIN(N29:O29)+5)<22,\"S-14048\",IF((MIN(N29:O29)+5)<34,\"S-14049\",IF((MIN(N29:O29)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Z": {
          "address": "Z29",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA29",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB29",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC29",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD29",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE29",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF29",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-f765f448",
    "orderNumber": "WPS-f765f448",
    "customerName": "Jim (Shari) Gong",
    "artworkTitle": "Mount Hood",
    "productType": "TEXTURED_REPLICA_3D",
    "width": 14,
    "height": 19,
    "frameInfo": "Gold REH NEW",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "WAITING",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "WAITING",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 75,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 30,
      "sourceRecordId": "WPS-f765f448",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A30",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "B": {
          "address": "B30",
          "value": 25,
          "formatted": "25",
          "formula": "A30-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "D": {
          "address": "D30",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A30-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "G": {
          "address": "G30",
          "value": "Jim (Shari) Gong",
          "formatted": "Jim (Shari) Gong",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "H": {
          "address": "H30",
          "value": "Mount Hood",
          "formatted": "Mount Hood",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "I": {
          "address": "I30",
          "value": "14 x 19",
          "formatted": "14 x 19",
          "formula": "MIN(N30:O30)&\" x \"&MAX(N30:O30)",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "J": {
          "address": "J30",
          "value": "Gold REH NEW",
          "formatted": "Gold REH NEW",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "K": {
          "address": "K30",
          "value": 8,
          "formatted": "8",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "L": {
          "address": "L30",
          "value": 2800,
          "formatted": "$2,800.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "M": {
          "address": "M30",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "N": {
          "address": "N30",
          "value": 14,
          "formatted": "14",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "O": {
          "address": "O30",
          "value": 19,
          "formatted": "19",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "P": {
          "address": "P30",
          "value": "2 3D Lim",
          "formatted": "2 3D Lim",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "V": {
          "address": "V30",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "W": {
          "address": "W30",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "X": {
          "address": "X30",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG30:BH30)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Y": {
          "address": "Y30",
          "value": 23,
          "formatted": "#REF!",
          "formula": "IF(U30>165,\"CRATE\",IF(J30=\"Rolled\",IF((MIN(N30:O30)+5)<22,\"S-14048\",IF((MIN(N30:O30)+5)<34,\"S-14049\",IF((MIN(N30:O30)+5)<54,\"S-5574\"))),\"CNC\"))",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Z": {
          "address": "Z30",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA30",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB30",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC30",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AD": {
          "address": "AD30",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE30",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF30",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        }
      }
    }
  },
  {
    "id": "WPS-3c2dd154",
    "orderNumber": "WPS-3c2dd154",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 30,
    "height": 60,
    "frameInfo": "None",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 31,
      "sourceRecordId": "WPS-3c2dd154",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A31",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B31",
          "value": 25,
          "formatted": "25",
          "formula": "A31-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D31",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A31-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G31",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H31",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I31",
          "value": "30 x 60",
          "formatted": "30 x 60",
          "formula": "MIN(N31:O31)&\" x \"&MAX(N31:O31)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J31",
          "value": "None",
          "formatted": "None",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K31",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L31",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M31",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N31",
          "value": 30,
          "formatted": "30",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O31",
          "value": 60,
          "formatted": "60",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P31",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V31",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W31",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X31",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG31:BH31)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y31",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z31",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA31",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB31",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC31",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD31",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE31",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF31",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-3f2dd60d",
    "orderNumber": "WPS-3f2dd60d",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 36,
    "height": 48,
    "frameInfo": "None",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 32,
      "sourceRecordId": "WPS-3f2dd60d",
      "identityOccurrence": 2,
      "cells": {
        "A": {
          "address": "A32",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B32",
          "value": 25,
          "formatted": "25",
          "formula": "A32-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D32",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A32-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G32",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H32",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I32",
          "value": "36 x 48",
          "formatted": "36 x 48",
          "formula": "MIN(N32:O32)&\" x \"&MAX(N32:O32)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J32",
          "value": "None",
          "formatted": "None",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K32",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L32",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M32",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N32",
          "value": 36,
          "formatted": "36",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O32",
          "value": 48,
          "formatted": "48",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P32",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V32",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W32",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X32",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG32:BH32)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y32",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z32",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA32",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB32",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC32",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD32",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE32",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF32",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-3e2dd47a",
    "orderNumber": "WPS-3e2dd47a",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 36,
    "height": 48,
    "frameInfo": "None",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 33,
      "sourceRecordId": "WPS-3e2dd47a",
      "identityOccurrence": 3,
      "cells": {
        "A": {
          "address": "A33",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B33",
          "value": 25,
          "formatted": "25",
          "formula": "A33-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D33",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A33-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G33",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H33",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I33",
          "value": "36 x 48",
          "formatted": "36 x 48",
          "formula": "MIN(N33:O33)&\" x \"&MAX(N33:O33)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J33",
          "value": "None",
          "formatted": "None",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K33",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L33",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M33",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N33",
          "value": 36,
          "formatted": "36",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O33",
          "value": 48,
          "formatted": "48",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P33",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V33",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W33",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X33",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG33:BH33)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y33",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z33",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA33",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB33",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC33",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD33",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE33",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF33",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-392dcc9b",
    "orderNumber": "WPS-392dcc9b",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 30,
    "height": 48,
    "frameInfo": "None",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 34,
      "sourceRecordId": "WPS-392dcc9b",
      "identityOccurrence": 4,
      "cells": {
        "A": {
          "address": "A34",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B34",
          "value": 25,
          "formatted": "25",
          "formula": "A34-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D34",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A34-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G34",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H34",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I34",
          "value": "30 x 48",
          "formatted": "30 x 48",
          "formula": "MIN(N34:O34)&\" x \"&MAX(N34:O34)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J34",
          "value": "None",
          "formatted": "None",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K34",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L34",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M34",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N34",
          "value": 30,
          "formatted": "30",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O34",
          "value": 48,
          "formatted": "48",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P34",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V34",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W34",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X34",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG34:BH34)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y34",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z34",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA34",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB34",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC34",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD34",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE34",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF34",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-382dcb08",
    "orderNumber": "WPS-382dcb08",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 30,
    "height": 48,
    "frameInfo": "None",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 35,
      "sourceRecordId": "WPS-382dcb08",
      "identityOccurrence": 5,
      "cells": {
        "A": {
          "address": "A35",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B35",
          "value": 25,
          "formatted": "25",
          "formula": "A35-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D35",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A35-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G35",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H35",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I35",
          "value": "30 x 48",
          "formatted": "30 x 48",
          "formula": "MIN(N35:O35)&\" x \"&MAX(N35:O35)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J35",
          "value": "None",
          "formatted": "None",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K35",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L35",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M35",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N35",
          "value": 30,
          "formatted": "30",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O35",
          "value": 48,
          "formatted": "48",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P35",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V35",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W35",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X35",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG35:BH35)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y35",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z35",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA35",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB35",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC35",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD35",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE35",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF35",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-3b2dcfc1",
    "orderNumber": "WPS-3b2dcfc1",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 30,
    "height": 48,
    "frameInfo": "None",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 36,
      "sourceRecordId": "WPS-3b2dcfc1",
      "identityOccurrence": 6,
      "cells": {
        "A": {
          "address": "A36",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B36",
          "value": 25,
          "formatted": "25",
          "formula": "A36-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D36",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A36-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G36",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H36",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I36",
          "value": "30 x 48",
          "formatted": "30 x 48",
          "formula": "MIN(N36:O36)&\" x \"&MAX(N36:O36)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J36",
          "value": "None",
          "formatted": "None",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K36",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L36",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M36",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N36",
          "value": 30,
          "formatted": "30",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O36",
          "value": 48,
          "formatted": "48",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P36",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V36",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W36",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X36",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG36:BH36)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y36",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z36",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA36",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB36",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC36",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD36",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE36",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF36",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-3a2dce2e",
    "orderNumber": "WPS-3a2dce2e",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 30,
    "height": 48,
    "frameInfo": "None",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 37,
      "sourceRecordId": "WPS-3a2dce2e",
      "identityOccurrence": 7,
      "cells": {
        "A": {
          "address": "A37",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B37",
          "value": 25,
          "formatted": "25",
          "formula": "A37-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D37",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A37-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G37",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H37",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I37",
          "value": "30 x 48",
          "formatted": "30 x 48",
          "formula": "MIN(N37:O37)&\" x \"&MAX(N37:O37)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J37",
          "value": "None",
          "formatted": "None",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K37",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L37",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M37",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N37",
          "value": 30,
          "formatted": "30",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O37",
          "value": 48,
          "formatted": "48",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P37",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V37",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W37",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X37",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG37:BH37)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y37",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z37",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA37",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB37",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC37",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD37",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE37",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF37",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-352dc64f",
    "orderNumber": "WPS-352dc64f",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 28,
    "height": 36,
    "frameInfo": "None",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 38,
      "sourceRecordId": "WPS-352dc64f",
      "identityOccurrence": 8,
      "cells": {
        "A": {
          "address": "A38",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B38",
          "value": 25,
          "formatted": "25",
          "formula": "A38-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D38",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A38-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G38",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H38",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I38",
          "value": "28 x 36",
          "formatted": "28 x 36",
          "formula": "MIN(N38:O38)&\" x \"&MAX(N38:O38)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J38",
          "value": "None",
          "formatted": "None",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K38",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L38",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M38",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N38",
          "value": 28,
          "formatted": "28",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O38",
          "value": 36,
          "formatted": "36",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P38",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V38",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W38",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X38",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG38:BH38)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y38",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z38",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA38",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB38",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC38",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD38",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE38",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF38",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-342dc4bc",
    "orderNumber": "WPS-342dc4bc",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 28,
    "height": 36,
    "frameInfo": "None",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 39,
      "sourceRecordId": "WPS-342dc4bc",
      "identityOccurrence": 9,
      "cells": {
        "A": {
          "address": "A39",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B39",
          "value": 25,
          "formatted": "25",
          "formula": "A39-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D39",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A39-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G39",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H39",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I39",
          "value": "28 x 36",
          "formatted": "28 x 36",
          "formula": "MIN(N39:O39)&\" x \"&MAX(N39:O39)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J39",
          "value": "None",
          "formatted": "None",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K39",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L39",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M39",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N39",
          "value": 28,
          "formatted": "28",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O39",
          "value": 36,
          "formatted": "36",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P39",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V39",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W39",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X39",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG39:BH39)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y39",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z39",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA39",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB39",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC39",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD39",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE39",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF39",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-213db9bd",
    "orderNumber": "WPS-213db9bd",
    "customerName": "Erin's Studio",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 24,
    "height": 30,
    "frameInfo": "None",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 40,
      "sourceRecordId": "WPS-213db9bd",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A40",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B40",
          "value": 25,
          "formatted": "25",
          "formula": "A40-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D40",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A40-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G40",
          "value": "Erin's Studio",
          "formatted": "Erin's Studio",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H40",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I40",
          "value": "24 x 30",
          "formatted": "24 x 30",
          "formula": "MIN(N40:O40)&\" x \"&MAX(N40:O40)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J40",
          "value": "None",
          "formatted": "None",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K40",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L40",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M40",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N40",
          "value": 24,
          "formatted": "24",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O40",
          "value": 30,
          "formatted": "30",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P40",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V40",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W40",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X40",
          "value": 0.044444444444444446,
          "formatted": "1:04",
          "formula": "SUM(AG40:BH40)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y40",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z40",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA40",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB40",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AC": {
          "address": "AC40",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD40",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE40",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF40",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-2020a06c",
    "orderNumber": "WPS-2020a06c",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 24,
    "height": 37,
    "frameInfo": "Gold EH",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 41,
      "sourceRecordId": "WPS-2020a06c",
      "identityOccurrence": 10,
      "cells": {
        "A": {
          "address": "A41",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B41",
          "value": 25,
          "formatted": "25",
          "formula": "A41-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D41",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A41-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G41",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H41",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I41",
          "value": "24 x 37",
          "formatted": "24 x 37",
          "formula": "MIN(N41:O41)&\" x \"&MAX(N41:O41)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J41",
          "value": "Gold EH",
          "formatted": "Gold EH",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K41",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L41",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M41",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N41",
          "value": 24,
          "formatted": "24",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O41",
          "value": 37,
          "formatted": "37",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P41",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V41",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W41",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X41",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG41:BH41)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y41",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z41",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA41",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB41",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC41",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD41",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE41",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF41",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-2120a1ff",
    "orderNumber": "WPS-2120a1ff",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 24,
    "height": 48,
    "frameInfo": "Gold EH",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 42,
      "sourceRecordId": "WPS-2120a1ff",
      "identityOccurrence": 11,
      "cells": {
        "A": {
          "address": "A42",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B42",
          "value": 25,
          "formatted": "25",
          "formula": "A42-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D42",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A42-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G42",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H42",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I42",
          "value": "24 x 48",
          "formatted": "24 x 48",
          "formula": "MIN(N42:O42)&\" x \"&MAX(N42:O42)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J42",
          "value": "Gold EH",
          "formatted": "Gold EH",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K42",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L42",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M42",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N42",
          "value": 24,
          "formatted": "24",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O42",
          "value": 48,
          "formatted": "48",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P42",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V42",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W42",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X42",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG42:BH42)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y42",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z42",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA42",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB42",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC42",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD42",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE42",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF42",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-2220a392",
    "orderNumber": "WPS-2220a392",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 22,
    "height": 36,
    "frameInfo": "Gold EH",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 43,
      "sourceRecordId": "WPS-2220a392",
      "identityOccurrence": 12,
      "cells": {
        "A": {
          "address": "A43",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B43",
          "value": 25,
          "formatted": "25",
          "formula": "A43-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D43",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A43-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G43",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H43",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I43",
          "value": "22 x 36",
          "formatted": "22 x 36",
          "formula": "MIN(N43:O43)&\" x \"&MAX(N43:O43)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J43",
          "value": "Gold EH",
          "formatted": "Gold EH",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K43",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L43",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M43",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N43",
          "value": 22,
          "formatted": "22",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O43",
          "value": 36,
          "formatted": "36",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P43",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V43",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W43",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X43",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG43:BH43)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y43",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z43",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA43",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB43",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC43",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD43",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE43",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF43",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-2320a525",
    "orderNumber": "WPS-2320a525",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 24,
    "height": 28,
    "frameInfo": "Gold EH",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 44,
      "sourceRecordId": "WPS-2320a525",
      "identityOccurrence": 13,
      "cells": {
        "A": {
          "address": "A44",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B44",
          "value": 25,
          "formatted": "25",
          "formula": "A44-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D44",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A44-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G44",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H44",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I44",
          "value": "24 x 28",
          "formatted": "24 x 28",
          "formula": "MIN(N44:O44)&\" x \"&MAX(N44:O44)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J44",
          "value": "Gold EH",
          "formatted": "Gold EH",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K44",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L44",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M44",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N44",
          "value": 24,
          "formatted": "24",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O44",
          "value": 28,
          "formatted": "28",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P44",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V44",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W44",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X44",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG44:BH44)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y44",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z44",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA44",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB44",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC44",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD44",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE44",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF44",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-1c209a20",
    "orderNumber": "WPS-1c209a20",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 21,
    "height": 28,
    "frameInfo": "Gold EH",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 45,
      "sourceRecordId": "WPS-1c209a20",
      "identityOccurrence": 14,
      "cells": {
        "A": {
          "address": "A45",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B45",
          "value": 25,
          "formatted": "25",
          "formula": "A45-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D45",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A45-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G45",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H45",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I45",
          "value": "21 x 28",
          "formatted": "21 x 28",
          "formula": "MIN(N45:O45)&\" x \"&MAX(N45:O45)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J45",
          "value": "Gold EH",
          "formatted": "Gold EH",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K45",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L45",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M45",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N45",
          "value": 21,
          "formatted": "21",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O45",
          "value": 28,
          "formatted": "28",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P45",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V45",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W45",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X45",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG45:BH45)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y45",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z45",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA45",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB45",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC45",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD45",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE45",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF45",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-1d209bb3",
    "orderNumber": "WPS-1d209bb3",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 26,
    "height": 34,
    "frameInfo": "Gold EH",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 46,
      "sourceRecordId": "WPS-1d209bb3",
      "identityOccurrence": 15,
      "cells": {
        "A": {
          "address": "A46",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B46",
          "value": 25,
          "formatted": "25",
          "formula": "A46-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D46",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A46-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G46",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H46",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I46",
          "value": "26 x 34",
          "formatted": "26 x 34",
          "formula": "MIN(N46:O46)&\" x \"&MAX(N46:O46)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J46",
          "value": "Gold EH",
          "formatted": "Gold EH",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K46",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L46",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M46",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N46",
          "value": 26,
          "formatted": "26",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O46",
          "value": 34,
          "formatted": "34",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P46",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V46",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W46",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X46",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG46:BH46)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y46",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z46",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA46",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB46",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC46",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD46",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE46",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF46",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-1e209d46",
    "orderNumber": "WPS-1e209d46",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 26,
    "height": 38,
    "frameInfo": "Gold EH",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 47,
      "sourceRecordId": "WPS-1e209d46",
      "identityOccurrence": 16,
      "cells": {
        "A": {
          "address": "A47",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B47",
          "value": 25,
          "formatted": "25",
          "formula": "A47-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D47",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A47-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G47",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H47",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I47",
          "value": "26 x 38",
          "formatted": "26 x 38",
          "formula": "MIN(N47:O47)&\" x \"&MAX(N47:O47)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J47",
          "value": "Gold EH",
          "formatted": "Gold EH",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K47",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L47",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M47",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N47",
          "value": 26,
          "formatted": "26",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O47",
          "value": 38,
          "formatted": "38",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P47",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V47",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W47",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X47",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG47:BH47)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y47",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z47",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA47",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB47",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC47",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD47",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE47",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF47",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-1f209ed9",
    "orderNumber": "WPS-1f209ed9",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 36,
    "height": 60,
    "frameInfo": "Gold EH",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 48,
      "sourceRecordId": "WPS-1f209ed9",
      "identityOccurrence": 17,
      "cells": {
        "A": {
          "address": "A48",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B48",
          "value": 25,
          "formatted": "25",
          "formula": "A48-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D48",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A48-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G48",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H48",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I48",
          "value": "36 x 60",
          "formatted": "36 x 60",
          "formula": "MIN(N48:O48)&\" x \"&MAX(N48:O48)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J48",
          "value": "Gold EH",
          "formatted": "Gold EH",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K48",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L48",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M48",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N48",
          "value": 36,
          "formatted": "36",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O48",
          "value": 60,
          "formatted": "60",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P48",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V48",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W48",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X48",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG48:BH48)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y48",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z48",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA48",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB48",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC48",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD48",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE48",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF48",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-2820ad04",
    "orderNumber": "WPS-2820ad04",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 39,
    "height": 39,
    "frameInfo": "Gold EH",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 49,
      "sourceRecordId": "WPS-2820ad04",
      "identityOccurrence": 18,
      "cells": {
        "A": {
          "address": "A49",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B49",
          "value": 25,
          "formatted": "25",
          "formula": "A49-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D49",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A49-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G49",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H49",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I49",
          "value": "39 x 39",
          "formatted": "39 x 39",
          "formula": "MIN(N49:O49)&\" x \"&MAX(N49:O49)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J49",
          "value": "Gold EH",
          "formatted": "Gold EH",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K49",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L49",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M49",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N49",
          "value": 39,
          "formatted": "39",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O49",
          "value": 39,
          "formatted": "39",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P49",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V49",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W49",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X49",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG49:BH49)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y49",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z49",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA49",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB49",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC49",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD49",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE49",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF49",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-2920ae97",
    "orderNumber": "WPS-2920ae97",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 23,
    "height": 30,
    "frameInfo": "Silver EH",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 50,
      "sourceRecordId": "WPS-2920ae97",
      "identityOccurrence": 19,
      "cells": {
        "A": {
          "address": "A50",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B50",
          "value": 25,
          "formatted": "25",
          "formula": "A50-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D50",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A50-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G50",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H50",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I50",
          "value": "23 x 30",
          "formatted": "23 x 30",
          "formula": "MIN(N50:O50)&\" x \"&MAX(N50:O50)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J50",
          "value": "Silver EH",
          "formatted": "Silver EH",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K50",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L50",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M50",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N50",
          "value": 23,
          "formatted": "23",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O50",
          "value": 30,
          "formatted": "30",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P50",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V50",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W50",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X50",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG50:BH50)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y50",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z50",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA50",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB50",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC50",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD50",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE50",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF50",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-b2284207",
    "orderNumber": "WPS-b2284207",
    "customerName": "Erin Hanson",
    "artworkTitle": "Original Canvas",
    "productType": "ORIGINAL",
    "width": 24,
    "height": 32,
    "frameInfo": "Silver EH",
    "dueDate": "2026-08-31",
    "dueStatus": "ON_TRACK",
    "priority": "ORIGINALS",
    "assignedWorkerId": "",
    "notes": "",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "NOT_APPLICABLE",
      "DIBOND": "NOT_APPLICABLE",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "NOT_APPLICABLE",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 0,
      "PRINTED": 0,
      "DIBOND": 0,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-08-31",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 51,
      "sourceRecordId": "WPS-b2284207",
      "identityOccurrence": 20,
      "cells": {
        "A": {
          "address": "A51",
          "value": 46265,
          "formatted": "Mon, Aug 31",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "B": {
          "address": "B51",
          "value": 25,
          "formatted": "25",
          "formula": "A51-TODAY()",
          "style": {
            "patternType": "none"
          }
        },
        "D": {
          "address": "D51",
          "value": 46251,
          "formatted": "2026-08-17",
          "formula": "A51-14",
          "style": {
            "patternType": "none"
          }
        },
        "G": {
          "address": "G51",
          "value": "Erin Hanson",
          "formatted": "Erin Hanson",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "H": {
          "address": "H51",
          "value": "Original Canvas",
          "formatted": "Original Canvas",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "I": {
          "address": "I51",
          "value": "24 x 32",
          "formatted": "24 x 32",
          "formula": "MIN(N51:O51)&\" x \"&MAX(N51:O51)",
          "style": {
            "patternType": "none"
          }
        },
        "J": {
          "address": "J51",
          "value": "Silver EH",
          "formatted": "Silver EH",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "K": {
          "address": "K51",
          "value": "-",
          "formatted": "-",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "L": {
          "address": "L51",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "M": {
          "address": "M51",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "N": {
          "address": "N51",
          "value": 24,
          "formatted": "24",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "O": {
          "address": "O51",
          "value": 32,
          "formatted": "32",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "P": {
          "address": "P51",
          "value": "0 Orig",
          "formatted": "0 Orig",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "V": {
          "address": "V51",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "W": {
          "address": "W51",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "X": {
          "address": "X51",
          "value": 23,
          "formatted": "#REF!",
          "formula": "SUM(AG51:BH51)/1440",
          "style": {
            "patternType": "none"
          }
        },
        "Y": {
          "address": "Y51",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "Z": {
          "address": "Z51",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA51",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AB": {
          "address": "AB51",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AC": {
          "address": "AC51",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        },
        "AD": {
          "address": "AD51",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AE": {
          "address": "AE51",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AF": {
          "address": "AF51",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "none"
          }
        }
      }
    }
  },
  {
    "id": "WPS-890f4ff0",
    "orderNumber": "WPS-890f4ff0",
    "customerName": "Edward Herring",
    "artworkTitle": "Monterey Blues",
    "productType": "TEXTURED_REPLICA_3D",
    "width": 40,
    "height": 40,
    "frameInfo": "Silver REH",
    "dueDate": "2026-09-08",
    "dueStatus": "ON_TRACK",
    "priority": "CUSTOMER_PURCHASED",
    "assignedWorkerId": "",
    "notes": "Red note indicated in source workbook.",
    "steps": {
      "FILES": "WAITING",
      "PRINTED": "WAITING",
      "DIBOND": "WAITING",
      "STRETCHER_BASE": "WAITING",
      "MOUNTED": "WAITING",
      "FRAME_MADE": "WAITING",
      "FRAMED": "WAITING",
      "SHIPPED": "WAITING"
    },
    "estimatedMinutes": {
      "FILES": 15,
      "PRINTED": 50,
      "DIBOND": 75,
      "STRETCHER_BASE": 80,
      "MOUNTED": 90,
      "FRAME_MADE": 105,
      "FRAMED": 85,
      "SHIPPED": 40
    },
    "orderSource": "WORKSHOP_PRODUCTION_SHEET",
    "requestedDeliveryOrPickupDate": "2026-09-08",
    "redNotes": "Red note indicated in source workbook.",
    "originalImport": {
      "sourceFileName": "Warehouse Production Sheets.xlsx",
      "worksheetName": "Workshop List",
      "rowNumber": 52,
      "sourceRecordId": "WPS-890f4ff0",
      "identityOccurrence": 1,
      "cells": {
        "A": {
          "address": "A52",
          "value": 46273,
          "formatted": "Tue, Sep 08",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "B": {
          "address": "B52",
          "value": 33,
          "formatted": "33",
          "formula": "A52-TODAY()",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "D": {
          "address": "D52",
          "value": 46259,
          "formatted": "2026-08-25",
          "formula": "A52-14",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "G": {
          "address": "G52",
          "value": "Edward Herring (Red Note)",
          "formatted": "Edward Herring (Red Note)",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "H": {
          "address": "H52",
          "value": "Monterey Blues",
          "formatted": "Monterey Blues",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "I": {
          "address": "I52",
          "value": "40 x 40",
          "formatted": "40 x 40",
          "formula": "MIN(N52:O52)&\" x \"&MAX(N52:O52)",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "J": {
          "address": "J52",
          "value": "Silver REH",
          "formatted": "Silver REH",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "K": {
          "address": "K52",
          "value": 5,
          "formatted": "5",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "L": {
          "address": "L52",
          "value": 4500,
          "formatted": "$4,500.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "M": {
          "address": "M52",
          "value": 0,
          "formatted": "$0.00",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "N": {
          "address": "N52",
          "value": 40,
          "formatted": "40",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "O": {
          "address": "O52",
          "value": 40,
          "formatted": "40",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "P": {
          "address": "P52",
          "value": "2 3D Lim",
          "formatted": "2 3D Lim",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "V": {
          "address": "V52",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "W": {
          "address": "W52",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "X": {
          "address": "X52",
          "value": 0.044444444444444446,
          "formatted": "1:04",
          "formula": "SUM(AG52:BH52)/1440",
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Y": {
          "address": "Y52",
          "value": "GALLERY",
          "formatted": "GALLERY",
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "Z": {
          "address": "Z52",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "000000"
            },
            "bgColor": {
              "rgb": "000000"
            }
          }
        },
        "AA": {
          "address": "AA52",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AB": {
          "address": "AB52",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AC": {
          "address": "AC52",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AD": {
          "address": "AD52",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AE": {
          "address": "AE52",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        },
        "AF": {
          "address": "AF52",
          "value": null,
          "formatted": null,
          "formula": null,
          "style": {
            "patternType": "solid",
            "fgColor": {
              "rgb": "F4CCCC"
            },
            "bgColor": {
              "rgb": "F4CCCC"
            }
          }
        }
      }
    }
  }
]

export const workshopProductionSheetJobs: ProductionJob[] = generatedJobs.map((job) => ({
  ...job,
  dueStatus: calculateDueStatus(job.dueDate, job.onHold),
}))

export const workshopProductionSheetSeedMetadata = {
  "sourceFileName": "Warehouse Production Sheets.xlsx",
  "sourceWorksheet": "Workshop List",
  "generatedJobCount": 46,
  "expectedPieceCount": 47,
  "issues": [
    "Workshop List control cell I4 reports 47 pieces, but 46 populated rows were found."
  ],
  "worksheetCount": 20,
  "hiddenWorksheetCount": 19,
  "formulaCellCount": 15572
} as const
