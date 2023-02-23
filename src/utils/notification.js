import ReactDOM from "react-dom";
import Notification from "../components/notification";

export const notify = (message, type = "success", duration = 6000) => {
  const notifyContainer = document.getElementById("notify-container");
  if (notifyContainer) {
    ReactDOM.render(
      <Notification message={message} type={type} duration={duration} />,
      notifyContainer
    );
  }

  setTimeout(() => {
    ReactDOM.unmountComponentAtNode(notifyContainer);
  }, duration);
};
