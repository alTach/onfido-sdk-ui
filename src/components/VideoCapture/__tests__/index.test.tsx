import { h, FunctionComponent } from 'preact'
import { mount, shallow, ReactWrapper } from 'enzyme'

import MockedLocalised from '~jest/MockedLocalised'
import MockedReduxProvider from '~jest/MockedReduxProvider'
import Camera from '../../Camera'
import VideoCapture, {
  VideoOverlayProps,
  Props as VideoCaptureProps,
} from '../index'

import type { CameraProps } from '~types/camera'
import type { WithTrackingProps } from '~types/hocs'

jest.mock('~utils')

const assertTimeout = (wrapper: ReactWrapper, seconds: number) => {
  const timeout = wrapper.find('Timeout')
  expect(timeout.exists()).toBeTruthy()
  expect(timeout.prop('seconds')).toEqual(seconds)
}

const assertInactiveError = (wrapper: ReactWrapper, forceRedo: boolean) => {
  expect(wrapper.find('#record-video').text()).toEqual('Start')
  expect(wrapper.find('Timeout').exists()).toBeFalsy()

  const error = wrapper.find('CameraError Error')
  expect(error.exists()).toBeTruthy()

  if (forceRedo) {
    expect(wrapper.find('#record-video').prop('disabled')).toBeTruthy()
    expect(wrapper.find('FallbackButton').text()).toEqual(
      'selfie_capture.alert.timeout.detail'
    )
  } else {
    expect(error.find('.title').text()).toEqual(
      'selfie_capture.alert.camera_inactive.title'
    )
  }
}

const MockedVideoLayer: FunctionComponent<VideoOverlayProps> = ({
  disableInteraction,
  isRecording,
  onStart,
  onStop,
}) => (
  <button
    id="record-video"
    disabled={disableInteraction}
    onClick={isRecording ? onStop : onStart}
  >
    {isRecording ? 'Stop' : 'Start'}
  </button>
)

const defaultProps: VideoCaptureProps = {
  inactiveError: { name: 'CAMERA_INACTIVE' },
  onRecordingStart: jest.fn(),
  onRedo: jest.fn(),
  onVideoCapture: jest.fn(),
  renderFallback: jest.fn(),
  renderVideoOverlay: (props) => <MockedVideoLayer {...props} />, // eslint-disable-line react/display-name
  trackScreen: jest.fn(),
}

describe('VideoCapture', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallow(<VideoCapture {...defaultProps} />)
    expect(wrapper.exists()).toBeTruthy()
  })

  describe('when mounted', () => {
    let wrapper: ReactWrapper
    let camera: ReactWrapper<CameraProps & WithTrackingProps>

    beforeEach(() => {
      wrapper = mount(
        <MockedReduxProvider>
          <MockedLocalised>
            <VideoCapture {...defaultProps} title="Fake title" />
          </MockedLocalised>
        </MockedReduxProvider>
      )

      camera = wrapper.find<CameraProps & WithTrackingProps>(Camera)
    })

    it('renders Camera correctly', () => {
      expect(wrapper.exists()).toBeTruthy()
      expect(camera.exists()).toBeTruthy()

      const {
        buttonType,
        isButtonDisabled,
        renderError,
        renderFallback,
      } = camera.props()
      expect(buttonType).toEqual('video')
      expect(isButtonDisabled).toBeFalsy()
      expect(renderError).toBeFalsy()

      renderFallback('fake_fallback_reason')
      expect(defaultProps.renderFallback).toHaveBeenCalledWith(
        'fake_fallback_reason'
      )

      expect(wrapper.find('PageTitle').exists()).toBeTruthy()
      expect(wrapper.find('PageTitle').text()).toEqual('Fake title')
    })

    it('renders inactive timeout correctly', () => assertTimeout(wrapper, 12))

    describe('when inactive timed out', () => {
      beforeEach(() => {
        jest.advanceTimersByTime(12_000) // 12 seconds - default value
        wrapper.update()
      })

      it('shows inactive error correctly', () =>
        assertInactiveError(wrapper, false))
    })

    describe('when recording', () => {
      beforeEach(() => {
        wrapper.find('#record-video').simulate('click')
      })

      it('starts video recording and hides title', () => {
        expect(wrapper.find('#record-video').text()).toEqual('Stop')
        expect(defaultProps.onRecordingStart).toHaveBeenCalled()
        expect(wrapper.find('PageTitle').exists()).toBeFalsy()
      })

      it('renders inactive timeout correctly', () => assertTimeout(wrapper, 20))

      it('stops video recording with capture payload', () => {
        wrapper.find('#record-video').simulate('click')
        expect(wrapper.find('#record-video').text()).toEqual('Start')

        expect(defaultProps.onVideoCapture).toHaveBeenCalledWith({
          blob: new Blob(),
          sdkMetadata: {
            camera_name: 'fake-video-track',
            captureMethod: 'live',
            microphone_name: 'fake-audio-track',
          },
        })
      })

      describe('when inactive timed out', () => {
        beforeEach(() => {
          jest.advanceTimersByTime(20_000) // 20 seconds - default value
          wrapper.update()
        })

        it('shows inactive error correctly', () =>
          assertInactiveError(wrapper, true))
      })
    })
  })
})
