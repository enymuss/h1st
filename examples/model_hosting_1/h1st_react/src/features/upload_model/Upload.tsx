import React, { useState, useRef, useCallback } from "react";
import klass from "classnames";
import { v4 } from "uuid";

import { useAuth0 } from "@auth0/auth0-react";
import { useAppSelector, useAppDispatch } from "app/hooks";
import {
  addModelInput,
  selectApplication,
  updateApplicationName,
  updateApplicationDescription,
  resetApplicationState,
  hideUploadForm,
  showMessage,
  addModel,
} from "./uploadSlice";
import { useDropzone } from "react-dropzone";
import ModelInput from "features/upload_model/components/model_input";
import ModelOutput from "features/upload_model/components/model_output";
import UploadService from "features/upload_model/service.upload";

import styles from "./Upload.module.css";
import { addEmitHelper } from "typescript";

const axios = require("axios").default;

const BUTTON_STATES = {
  IDLE: "Save",
  UPLOADING: "Uploading...Please wait.",
  SAVING: "Saving...Please wait",
};

export default function UploadForm() {
  const { getAccessTokenSilently } = useAuth0();
  const fileRef = useRef<HTMLInputElement>(null);

  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [buttonState, setButtonState] = useState(BUTTON_STATES.IDLE);

  const onDrop = useCallback(async (acceptedFiles) => {
    // reset progress
    setProgress(0);
    setUploadedFile(null);
    setButtonState(BUTTON_STATES.UPLOADING);

    const token = await getAccessTokenSilently();
    const result = await UploadService.upload(
      "/api/upload/",
      { file: acceptedFiles[0] },
      (event) => {
        const prog = Math.round((100 * event.loaded) / event.total);
        setProgress(prog);
      },
      token
    );

    if (result.data.status === "OK") {
      // set the uploaded file here
      setUploadedFile(result.data.id);
    }

    setButtonState(BUTTON_STATES.IDLE);
  }, []);

  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    onDrop,
  });
  const applicationInfo = useAppSelector(selectApplication);
  const dispatch = useAppDispatch();

  const files = acceptedFiles.map((file) => (
    // @ts-ignore
    <li key={file.path}>
      {/* @ts-ignore */}
      {file.path}
    </li>
  ));

  const updateAppName = (value: string) => {
    dispatch(updateApplicationName(value));
  };

  const updateAppDescription = (value: string) => {
    dispatch(updateApplicationDescription(value));
  };

  // const addNewModelInput = () => {
  //   dispatch(addModelInput({ type: "string", name: "", id: v4() }));
  // };

  const cancel = () => {
    UploadService.cancelRequest();
    dispatch(resetApplicationState());
    dispatch(hideUploadForm());
  };

  const submit = async () => {
    setSubmitted(true);
    setButtonState(BUTTON_STATES.SAVING);

    const token = await getAccessTokenSilently();
    const { name, description, input: rawInput, output } = applicationInfo;

    const input = rawInput.filter((i) => i.name.trim() !== "");
    const type = "TF";

    const response = await axios.post(
      "/api/upload/",
      {
        name,
        description,
        type,
        input,
        output,
        uploadedFile,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.status === "OK") {
      dispatch(resetApplicationState());
      dispatch(addModel(response.data.result));
      dispatch(hideUploadForm());
      dispatch(
        showMessage({
          title: "Success",
          message: `${name} has been queued for deployment successfully`,
        })
      );
      setSubmitted(false);
    }

    setButtonState(BUTTON_STATES.IDLE);
  };

  const modelInputs = applicationInfo.input.map((input, index) => (
    <li>
      <ModelInput
        key={input.id}
        id={input.id}
        name={input.name}
        index={index}
      />
    </li>
  ));

  return (
    <div className="py-6 px-8 shadow rounded bg-white">
      <div className="space-y-8 divide-y divide-gray-200">
        <div className="space-y-8 divide-y divide-gray-200">
          <div>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Upload a model
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload a Tensorflow model from your local drive.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <div
                  {...getRootProps({
                    className:
                      "hover:border-indigo-500 dropzone mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-gray-300 border-dashed rounded-md",
                  })}
                >
                  <div className="space-y-1 text-center relative">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0l-11 6v12.131l11 5.869 11-5.869v-12.066l-11-6.065zm-1 21.2l-8-4.268v-8.702l8 4.363v8.607zm10-4.268l-8 4.268v-9.793l-8.867-4.837 7.862-4.289 9.005 4.969v9.682zm-4.408-4.338l1.64-.917-.006.623-1.64.918.006-.624zm1.653-2.165l-1.641.919-.006.624 1.641-.918.006-.625zm0-1.19l-1.641.919-.006.624 1.641-.918.006-.625zm-3.747-.781l1.645-.96-.519-.273-1.646.959.52.274zm4.208 6.33l-.486-1.865-1.641.919-.523 2.431c-.229 1.105.422 1.31 1.311.812.886-.497 1.548-1.437 1.339-2.297zm-1.335 1.684c-.411.23-.821.262-.817-.136.005-.41.422-.852.835-1.083.407-.228.81-.25.806.165-.005.398-.415.825-.824 1.054zm-4.349-10.625l-.519-.274-1.646.96.52.274 1.645-.96zm-1.559-.826l-1.646.96.523.277 1.646-.96-.523-.277zm1.992 2.885l1.644-.958-.515-.274-1.647.958.518.274zm3.001 1.744l1.646-.96-.52-.273-1.645.959.519.274zm-6.029-5.177l-1.645.96.516.274 1.647-.959-.518-.275zm1.992 2.886l1.646-.96-.52-.274-1.645.959.519.275zm3.058 1.689l1.646-.959-.518-.274-1.646.96.518.273z" />
                    </svg>

                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          ref={fileRef}
                          {...getInputProps()}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      File size limit: 600MB
                    </p>
                    {acceptedFiles.length > 0 && (
                      <aside>
                        <ul>{files}</ul>
                        <span
                          className={klass(
                            styles["progress-bar"],
                            "w-64 h-2 bottom-2 left-0 bg-blue-200"
                          )}
                        >
                          <span
                            className={styles["progress-bar-content"]}
                            style={{
                              display: "block",
                              transform: `scaleX(${Number(
                                progress / 100
                              ).toFixed(2)})`,
                            }}
                          ></span>
                        </span>
                      </aside>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-8 divide-y divide-gray-200 pt-4">
          <div>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Application Information
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Provide information and upload your model file
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Application Name
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="username"
                    id="username"
                    autoComplete="username"
                    value={applicationInfo.name}
                    onChange={(e) => updateAppName(e.target.value)}
                    className={klass(
                      "flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 rounded sm:text-sm border-gray-300",
                      {
                        "border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500":
                          submitted && !applicationInfo.name,
                      }
                    )}
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label
                  htmlFor="about"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    placeholder="Model description"
                    id="description"
                    name="description"
                    rows={3}
                    value={applicationInfo.description}
                    onChange={(e) => updateAppDescription(e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <ModelOutput />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-start">
            <button
              type="button"
              className="disabled:pointer-events-none disabled:opacity-50 mr-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={
                !applicationInfo.name || // no application name
                !fileRef || // no file upload ref
                !uploadedFile || // there is no uploaded file
                buttonState !== BUTTON_STATES.IDLE // there is something going one
              }
              onClick={submit}
            >
              {buttonState}
            </button>

            <button
              type="button"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={cancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
