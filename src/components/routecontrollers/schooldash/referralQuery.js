var referralFilter = {
    'type': 'EXPRESSION',
    //'leftHandSide': {
    'leftHandSide': {
    'type': 'EXPRESSION',
      'leftHandSide': {
      'type': 'DIMENSION',
        'value': {
        'dimension': 'STUDENT',
          'field': 'School'
      }
    },
    'operator': 'EQUAL',
      'rightHandSide': {
        'type': 'PLACEHOLDER_NUMERIC',
        'value': '${schoolId}'
      }
    },
    'operator': 'AND',
    'rightHandSide': {
    'type': 'EXPRESSION',
      'leftHandSide': {
      'type': 'EXPRESSION',
        'leftHandSide': {
        'type': 'MEASURE',
          'value': {
          'measure': 'REFERRAL',
            'field': 'Behavior Date'
        }
      },
      'operator': 'GREATER_THAN_OR_EQUAL',
        'rightHandSide': {
        'type': 'PLACEHOLDER_DATE',
        'value': '${term.startDate}'
      }
    },
    'operator': 'AND',
      'rightHandSide': {
      'type': 'EXPRESSION',
        'leftHandSide': {
        'type': 'MEASURE',
          'value': {
          'measure': 'REFERRAL',
            'field': 'Behavior Date'
        }
      },
      'operator': 'LESS_THAN_OR_EQUAL',
        'rightHandSide': {
        'type': 'PLACEHOLDER_DATE',
        'value': '${term.endDate}'
      }
    }
  }
};

var referralStudentsQuery = {
  'aggregateMeasures': [{
    'measure': 'REFERRAL',
    'aggregation': 'SUM'
  }],
  'fields': [
    {
      'dimension': 'STUDENT',
      'field': 'ID'
    },
    {
      'dimension': 'STUDENT',
      'field': 'Name'
    }
  ],
  'filter': referralFilter,
  'having': {
    'type': 'EXPRESSION',
    'leftHandSide': {
      'type': 'MEASURE',
      'value': {
        'measure':'REFERRAL',
        'field': 'SUM'
      }
    },
    'operator': 'EQUAL',
    'rightHandSide': {
      'type': 'PLACEHOLDER_NUMERIC',
      'value': '${clickValue}'
    }
  }
};
