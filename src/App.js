import { useState, useEffect, useRef } from "react";
import logo from "./logo.svg";
import "./App.css";
import crowdFundABI from "./constractfiles/CrowdFunding.json";
import projectABI from "./constractfiles/Project.json";
import contractAddress from "./constractfiles/contractAddress.json";
import { ethers } from "ethers";

const ALCHEMY_Sepolia_API_KEY = process.env.REACT_APP_ALCHEMY_Sepolia_API_KEY;
const PRIVATE_KEY = process.env.REACT_APP_PRIVATE_KEY;

const web3Provider = new ethers.AlchemyProvider(
  "sepolia",
  ALCHEMY_Sepolia_API_KEY
);
const wallet = new ethers.Wallet(PRIVATE_KEY, web3Provider);

const instance = new ethers.Contract(
  contractAddress.contractAddress,
  crowdFundABI.abi,
  wallet
);

function IptItem({ label, children }) {
  return (
    <div className="field">
      <label className="label has-text-left	">{label}</label>
      <div className="control">{children}</div>
    </div>
  );
}

function ProjectItem({ data, onFund }) {
  const {
    projectTitle,
    projectStarter,
    projectDesc,
    currentState,
    currentAmount,
    deadline,
    goalAmount,
  } = data;
  const fundEl = useRef(null);
  const [loading, setLoading] = useState(false);

  const resTag = () => {
    if (currentState === 0) {
      return <span className="tag is-info is-medium">Ongoing</span>;
    } else if (currentState === 2) {
      return <span className="tag is-primary is-medium">Completed</span>;
    } else {
      return <span className="tag is-medium">Expired</span>;
    }
  };

  const makeFund = async () => {
    setLoading(true);
    await onFund(fundEl.current.value);
    fundEl.current.value = null;
    setLoading(false);
  };

  return (
    <div className="card" style={{ marginBottom: "10px" }}>
      {/* This is for showing the basic info of project */}
      <div className="card-content">
        <div className="media">
          <div className="media-content">
            <p className="title is-4">
              <span style={{ marginRight: "10px" }}>{resTag()}</span>
              {projectTitle}
            </p>
            <p className="title is-5">{projectDesc}</p>
          </div>
        </div>
        {/* The fund button warper, make sure this button can be seen when currentState value is 0 */}
        {currentState === 0 && (
          <div style={{ marginBottom: "10px" }}>
            <div className="field has-addons">
              <div className="control">
                <input
                  className="input is-rounded"
                  min={0}
                  ref={fundEl}
                  type="number"
                  placeholder="Input your funds"
                />
              </div>
              <div className="control">
                <a
                  className={`button is-primary ${
                    loading ? "is-loading" : " "
                  }`}
                  onClick={makeFund}
                >
                  Fund
                </a>
              </div>
            </div>
          </div>
        )}
        <div className="content">
          {/* Here is where the current amount and goal amount is, 
              also when currentState is 2 it means the project is reached the goal,
              at this time current amount should be the same as goal amount so it can be hidden
           */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span className="has-text-weight-bold">
              {currentState !== 2 && `${ethers.formatEther(currentAmount)} ETH`}
            </span>
            <span className="has-text-weight-bold">
              {ethers.formatEther(goalAmount)} ETH
            </span>
          </div>
          {/* progress element makes the project fund progress more visualize */}
          <progress
            style={{ margin: "0 10px" }}
            className="progress is-success"
            value={
              currentState === 2
                ? 100
                : (ethers.formatEther(currentAmount) /
                    ethers.formatEther(goalAmount)) *
                  100
            }
            max="100"
          ></progress>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [list, setList] = useState([]);
  const [projectCon, setProjectCon] = useState([]);
  const [projectInterval, setProjectInterval] = useState();
  const [previousNum, setPreviousNum] = useState();

  // these variables have same purpose get and modify corresponding input element value
  const iptTitle = useRef(null);
  const iptDesc = useRef(null);
  const iptDur = useRef(null);
  const iptAmount = useRef(null);

  useEffect(() => {
    (async () => {
      let res = await web3Provider.getBlockNumber();
      await getProjects();
    })();
  }, []);

  useEffect(() => {
    if (!projectCon) return;
    (async () => {
      let res = await Promise.all(projectCon.map((e) => e.getDetails()));
      if (previousNum !== res.length) {
        clearInterval(projectInterval);
      }
      setPreviousNum(res.length);
      setList(res);
      if (projectCon.length === 0) return;
    })();
  }, [projectCon]);

  // decide when modal should be showed
  const switchModal = (isShow = false) => {
    !isShow && clearIpt();
    setShowModal(isShow);
  };

  const getProjects = async () => {
    console.log(instance, 9999999);
    let arr = await instance.returnAllProjects();
    console.log("updating...");
    setProjectCon(
      arr.map((e) => new ethers.Contract(e, projectABI.abi, wallet))
    );
  };

  const clearIpt = () => {
    [iptTitle, iptDesc, iptDur, iptAmount].map((e) => (e.current.value = null));
  };

  const startProject = async () => {
    try {
      // set confirm into loading state
      setLoading(true);

      // get title, description and duration value
      let res = [iptTitle, iptDesc, iptDur].map((e) => e.current.value);

      let amount;
      // check input value whether is our needed
      // if not make a alert and cease the function by throw a error
      if (!(typeof (res[2] * 1) === "number" && res[2] * 1 > 0)) {
        alert("You have to input right duration");
        throw "";
      }
      if (
        typeof (iptAmount.current.value * 1) === "number" &&
        iptAmount.current.value * 1 > 0
      ) {
        amount = ethers.parseEther(iptAmount.current.value);
      } else {
        alert("You have to input right amount");
        throw "";
      }

      // start the project, set a interval to update the list
      let re = await instance.startProject(
        ...res,
        ethers.parseEther(iptAmount.current.value)
      );
      clearInterval(projectInterval);
      setProjectInterval(setInterval(getProjects, 800));
      switchModal(false);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const makeFund = (contract, idx) => async (val) => {
    // we will calling a payable method of contract
    // thus we should set the value to declare how much fund we want supply
    let overrides = {
      value: ethers.parseEther(val),
    };

    // waiting for the transaction has been made
    let tx = await contract.contribute(overrides);

    // wait for contract creation transaction to be mined
    await tx.wait();

    // after that we can get updated details, and replace old one with it
    let res = await contract.getDetails();
    setList(list.map((e, index) => (idx === index ? res : e)));
  };

  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header> */}
      <div>
        <button className="button is-primary" onClick={() => switchModal(true)}>
          START A PROJECT
        </button>
      </div>
      {/* show projects it will be a default project at first time */}
      <div
        style={{ textAlign: "left", padding: "10px 20px", overflow: "auto" }}
      >
        <span style={{ fontSize: "36px", fontWeight: "bold" }}>Projects:</span>
        {list.map((e, idx) => (
          <ProjectItem
            data={e}
            key={idx}
            onFund={makeFund(projectCon[idx], idx)}
          />
        ))}
      </div>
      {/* this is modal, where user will input the info of the project they want to make */}
      <div className={`modal ${showModal ? "is-active" : " "}`}>
        <div className="modal-background"></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Start your project</p>
            <button
              className="delete"
              aria-label="close"
              onClick={() => switchModal()}
            ></button>
          </header>
          <section className="modal-card-body">
            <div>
              <IptItem label="Title">
                <input
                  className="input"
                  ref={iptTitle}
                  type="text"
                  placeholder="input title"
                />
              </IptItem>
              <IptItem label="Description">
                <textarea
                  className="textarea"
                  ref={iptDesc}
                  type="text"
                  placeholder="input description"
                />
              </IptItem>
              <IptItem label="Amount Needed (ETH)">
                <input
                  className="input"
                  min={0}
                  ref={iptAmount}
                  type="number"
                  placeholder="input"
                />
              </IptItem>
              <IptItem label="Duration (in days)">
                <input
                  className="input"
                  min={0}
                  ref={iptDur}
                  type="number"
                  placeholder="input"
                />
              </IptItem>
            </div>
          </section>
          <footer className="modal-card-foot">
            <button
              className={`button is-primary ${loading ? "is-loading" : " "}`}
              onClick={startProject}
            >
              Confirm
            </button>
            <button className="button" onClick={() => switchModal()}>
              Cancel
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;
