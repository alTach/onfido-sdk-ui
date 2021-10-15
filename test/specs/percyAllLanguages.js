import { describe } from '../utils/mochaw'
import { fullTestCoverageLanguages } from '../percyAllLanguages.json'
import { welcomeScenarios } from './scenarios/welcome'
import { documentSelectorScenarios } from './scenarios/documentSelector'
import { documentScenarios } from './scenarios/document'
import { faceScenarios } from './scenarios/face'
import { proofOfAddressScenarios } from './scenarios/proofOfAddress'
import { crossDeviceDocumentVideoCaptureScenarios } from './scenarios/crossDeviceDocumentVideoCapture'

describe('Percy Visual Regression Tests - All Languages', () => {
  fullTestCoverageLanguages.forEach((lang) => {
    welcomeScenarios(lang)
    documentSelectorScenarios(lang)
    documentScenarios(lang)
    faceScenarios(lang)
    crossDeviceDocumentVideoCaptureScenarios(lang)
  })
  proofOfAddressScenarios()
})
